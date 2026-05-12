// Test mock for isomorphic-dompurify.
// In tests, sanitize() is a no-op pass-through.
// The real implementation strips XSS vectors at runtime.
const DOMPurify = {
  sanitize: (content) => {
    return content;
  },
};

export default DOMPurify;
