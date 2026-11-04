let activeRequests = 0;
const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener(activeRequests > 0));
};

export const startLoading = () => {
  activeRequests += 1;
  emit();
};

export const stopLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  emit();
};

export const subscribeToLoading = (listener) => {
  listeners.add(listener);
  listener(activeRequests > 0);

  return () => listeners.delete(listener);
};
