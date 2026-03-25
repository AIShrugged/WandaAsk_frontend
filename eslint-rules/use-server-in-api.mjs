/**
 * ESLint rule: enforce 'use server' directive in features api/ files.
 *
 * Every file matching features/*\/api\/*.ts must have 'use server' as the
 * first statement. This ensures all Server Actions are explicitly marked
 * and cannot be accidentally bundled into the client.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const useServerInApi = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Require 'use server' directive as the first statement in features/*/api/*.ts files",
      category: 'Best Practices',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingUseServer:
        "Files in features/*/api/ must start with 'use server'. All API files are Server Actions.",
    },
  },

  create(context) {
    const filePath = context.filename ?? context.getFilename?.() ?? '';

    const isApiFile = /features\/[^/]+\/api\/[^/]+\.tsx?$/.test(
      filePath.replaceAll('\\', '/'),
    );

    if (!isApiFile) {
      return {};
    }

    return {
      Program(node) {
        const firstStatement = node.body[0];

        const hasUseServer =
          firstStatement?.type === 'ExpressionStatement' &&
          firstStatement.expression.type === 'Literal' &&
          firstStatement.expression.value === 'use server';

        if (!hasUseServer) {
          context.report({
            node: firstStatement ?? node,
            messageId: 'missingUseServer',
            fix(fixer) {
              return fixer.insertTextBefore(
                firstStatement ?? node,
                "'use server';\n\n",
              );
            },
          });
        }
      },
    };
  },
};
