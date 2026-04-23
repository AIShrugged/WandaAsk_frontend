/**
 * ESLint rule: enforce PropsWithChildren instead of `children: ReactNode`.
 *
 * When a React component accepts `children` as a prop, it must use
 * `PropsWithChildren` from React rather than manually declaring
 * `children: ReactNode`, `children: React.ReactNode`, or
 * `Readonly<{ children: ReactNode }>`.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const preferPropsWithChildren = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require PropsWithChildren instead of manually declaring children: ReactNode in React components',
      category: 'Best Practices',
    },
    fixable: 'code',
    schema: [],
    messages: {
      usePropsWithChildren:
        'Use PropsWithChildren instead of manually declaring `children: ReactNode`. Import PropsWithChildren from react and extend/use it.',
      usePropsWithChildrenReadonly:
        'Use PropsWithChildren instead of `Readonly<{ children: ReactNode }>`. Replace with `PropsWithChildren`.',
    },
  },

  create(context) {
    const filePath = context.filename ?? context.getFilename?.() ?? '';
    const isTsxFile = /\.tsx$/.test(filePath.replaceAll('\\', '/'));

    if (!isTsxFile) {
      return {};
    }

    const sourceCode = context.sourceCode ?? context.getSourceCode?.();

    /**
     * Checks if an AST node is `ReactNode` or `React.ReactNode`.
     */
    function isReactNode(node) {
      if (!node) return false;
      // ReactNode (identifier)
      if (node.type === 'TSTypeReference') {
        if (
          node.typeName?.type === 'Identifier' &&
          node.typeName.name === 'ReactNode'
        ) {
          return true;
        }
        // React.ReactNode (member expression)
        if (
          node.typeName?.type === 'TSQualifiedName' &&
          node.typeName.left?.name === 'React' &&
          node.typeName.right?.name === 'ReactNode'
        ) {
          return true;
        }
      }
      return false;
    }

    /**
     * Checks if an inline TSTypeLiteral or TSInterfaceBody contains `children: ReactNode`.
     * Returns the property node if found, null otherwise.
     */
    function findChildrenProp(members) {
      return (
        members.find((member) => {
          return (
            member.type === 'TSPropertySignature' &&
            member.key?.name === 'children' &&
            isReactNode(member.typeAnnotation?.typeAnnotation)
          );
        }) ?? null
      );
    }

    /**
     * Reports a `children: ReactNode` property in an inline type literal.
     * The fix removes the `children` property; caller must ensure PropsWithChildren is used.
     */
    function reportInlineChildrenProp(childrenProp, typeLiteralNode) {
      context.report({
        node: childrenProp,
        messageId: 'usePropsWithChildren',
        // Auto-fix is intentionally omitted for inline type literals because the
        // structural rewrite (e.g. wrapping interface with extends PropsWithChildren)
        // depends on context that varies too much per callsite. The error message
        // guides the developer to the correct manual fix.
      });
    }

    return {
      // Pattern: function Foo({ children }: { children: ReactNode }) — inline object type
      TSTypeLiteral(node) {
        const childrenProp = findChildrenProp(node.members);
        if (!childrenProp) return;

        // Only report when this type literal is used as a function parameter annotation
        // (i.e. the parent is TSTypeAnnotation → parent is Identifier/ObjectPattern in params)
        const typeAnnotation = node.parent;
        if (typeAnnotation?.type !== 'TSTypeAnnotation') return;
        const annotationParent = typeAnnotation.parent;
        if (
          annotationParent?.type !== 'Identifier' &&
          annotationParent?.type !== 'ObjectPattern'
        ) {
          return;
        }

        reportInlineChildrenProp(childrenProp, node);
      },

      // Pattern: interface Props { children: ReactNode } — interface declaration
      TSInterfaceDeclaration(node) {
        const childrenProp = findChildrenProp(node.body.body);
        if (!childrenProp) return;

        context.report({
          node: childrenProp,
          messageId: 'usePropsWithChildren',
        });
      },

      // Pattern: type Props = { children: ReactNode } — type alias
      TSTypeAliasDeclaration(node) {
        if (node.typeAnnotation?.type !== 'TSTypeLiteral') return;
        const childrenProp = findChildrenProp(node.typeAnnotation.members);
        if (!childrenProp) return;

        context.report({
          node: childrenProp,
          messageId: 'usePropsWithChildren',
        });
      },

      // Pattern: Readonly<{ children: ReactNode }> — used in root layout
      TSTypeReference(node) {
        const name = node.typeName?.name;
        if (name !== 'Readonly') return;

        // @typescript-eslint/parser uses `typeArguments`; older parsers use `typeParameters`
        const typeArgs = node.typeArguments ?? node.typeParameters;
        const typeParam = typeArgs?.params?.[0];
        if (typeParam?.type !== 'TSTypeLiteral') return;

        const childrenProp = findChildrenProp(typeParam.members);
        if (!childrenProp) return;

        // Check this is used as a function parameter annotation
        const typeAnnotation = node.parent;
        if (typeAnnotation?.type !== 'TSTypeAnnotation') return;
        const annotationParent = typeAnnotation.parent;
        if (
          annotationParent?.type !== 'Identifier' &&
          annotationParent?.type !== 'ObjectPattern'
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'usePropsWithChildrenReadonly',
        });
      },
    };
  },
};
