/**
 * ESLint rule: enforce props extraction threshold in React components.
 *
 * - If a component has > 3 props typed inline → warn to extract to a named Props type.
 * - If a component has ≤ 3 props but uses a dedicated named Props interface defined
 *   only for that component → suggest inlining (warn).
 *
 * Applies only to .tsx files in features/, app/, and widgets/.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const propsExtractionThreshold = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Components with > 3 props must use a named Props type. Components with ≤ 3 props should use inline typing.',
      category: 'Best Practices',
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          threshold: { type: 'integer', minimum: 1, default: 3 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyInlineProps:
        'Component "{{name}}" has {{count}} inline props (threshold: {{threshold}}). Extract them to a named `interface {{name}}Props` or `type {{name}}Props` at the top of the file.',
      fewPropsInNamedType:
        'Component "{{name}}" has only {{count}} prop(s) but uses a dedicated named type `{{typeName}}`. Inline the type directly in the function signature.',
    },
  },

  create(context) {
    const filePath = context.filename ?? context.getFilename?.() ?? '';
    const normalized = filePath.replaceAll('\\', '/');

    const isTargetFile =
      /\/(features|app|widgets)\//.test(normalized) &&
      /\.tsx$/.test(normalized);

    if (!isTargetFile) {
      return {};
    }

    const threshold = context.options?.[0]?.threshold ?? 3;

    /**
     * Counts the number of members (props) in a TSTypeLiteral.
     */
    function countTypeLiteralMembers(typeLiteral) {
      if (!typeLiteral || typeLiteral.type !== 'TSTypeLiteral') return 0;
      return typeLiteral.members.filter(
        (m) =>
          m.type === 'TSPropertySignature' || m.type === 'TSMethodSignature',
      ).length;
    }

    /**
     * Returns the prop count from an inline type annotation on a function's first
     * parameter, or -1 if the param is not inline-typed with an object type.
     */
    function getInlinePropCount(param) {
      const annotation = param?.typeAnnotation?.typeAnnotation;
      if (!annotation) return -1;

      if (annotation.type === 'TSTypeLiteral') {
        return countTypeLiteralMembers(annotation);
      }

      // Readonly<{ ... }>
      if (
        annotation.type === 'TSTypeReference' &&
        annotation.typeName?.name === 'Readonly' &&
        annotation.typeParameters?.params?.[0]?.type === 'TSTypeLiteral'
      ) {
        return countTypeLiteralMembers(annotation.typeParameters.params[0]);
      }

      return -1;
    }

    /**
     * Returns the referenced type name if the parameter is typed via a named
     * type reference (interface/type alias), or null otherwise.
     */
    function getReferencedTypeName(param) {
      const annotation = param?.typeAnnotation?.typeAnnotation;
      if (!annotation) return null;

      if (
        annotation.type === 'TSTypeReference' &&
        annotation.typeName?.type === 'Identifier'
      ) {
        const name = annotation.typeName.name;
        // Skip React built-ins and standard utility types
        if (
          [
            'PropsWithChildren',
            'ReactNode',
            'FC',
            'FunctionComponent',
          ].includes(name)
        ) {
          return null;
        }
        return name;
      }

      return null;
    }

    /**
     * Returns the member count of a named type declaration in the current scope,
     * or -1 if not found.
     */
    function getNamedTypeMemberCount(typeName, scope) {
      // Walk up scopes to find the type declaration
      let currentScope = scope;
      while (currentScope) {
        for (const variable of currentScope.variables) {
          if (variable.name === typeName) {
            const def = variable.defs?.[0];
            if (!def) continue;

            const defNode = def.node;

            // interface declaration
            if (defNode.type === 'TSInterfaceDeclaration') {
              return defNode.body.body.filter(
                (m) =>
                  m.type === 'TSPropertySignature' ||
                  m.type === 'TSMethodSignature',
              ).length;
            }

            // type alias
            if (
              defNode.type === 'TSTypeAliasDeclaration' &&
              defNode.typeAnnotation?.type === 'TSTypeLiteral'
            ) {
              return countTypeLiteralMembers(defNode.typeAnnotation);
            }
          }
        }
        currentScope = currentScope.upper;
      }
      return -1;
    }

    /**
     * Checks if a function node is a React component (PascalCase name, returns JSX).
     */
    function isReactComponent(node) {
      let name = null;

      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        if (node.id) {
          name = node.id.name;
        } else if (node.parent?.type === 'VariableDeclarator') {
          name = node.parent.id?.name ?? null;
        } else if (node.parent?.type === 'ExportDefaultDeclaration') {
          name = null; // anonymous default export — skip name check
        }
      }

      // Must be PascalCase (starts with uppercase)
      if (name && !/^[A-Z]/.test(name)) return { isComponent: false, name };

      return { isComponent: true, name: name ?? 'Component' };
    }

    function checkFunction(node) {
      const { isComponent, name } = isReactComponent(node);
      if (!isComponent) return;

      const firstParam = node.params?.[0];
      if (!firstParam) return;

      // Skip rest params, non-object patterns
      if (
        firstParam.type !== 'ObjectPattern' &&
        firstParam.type !== 'Identifier'
      ) {
        return;
      }

      const inlineCount = getInlinePropCount(firstParam);

      if (inlineCount > threshold) {
        context.report({
          node: firstParam,
          messageId: 'tooManyInlineProps',
          data: {
            name,
            count: inlineCount,
            threshold,
          },
        });
        return;
      }

      if (inlineCount === -1) {
        // Typed via a named reference
        const typeName = getReferencedTypeName(firstParam);
        if (!typeName) return;

        const scope =
          context.getScope?.() ?? context.sourceCode?.getScope(node);
        if (!scope) return;

        const memberCount = getNamedTypeMemberCount(typeName, scope);
        if (memberCount === -1) return; // not found or from external file

        if (memberCount > 0 && memberCount <= threshold) {
          context.report({
            node: firstParam,
            messageId: 'fewPropsInNamedType',
            data: {
              name,
              count: memberCount,
              typeName,
            },
          });
        }
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
};
