import { toast } from "sonner";

const toastService = {
  success(message, options = {}) {
    return toast.success(message, options);
  },

  error(message, options = {}) {
    return toast.error(message, options);
  },

  warning(message, options = {}) {
    return toast.warning(message, options);
  },

  info(message, options = {}) {
    return toast.info(message, options);
  },

  loading(message, options = {}) {
    return toast.loading(message, options);
  },

  dismiss(toastId) {
    return toast.dismiss(toastId);
  },

  promise(promise, options = {}) {
    return toast.promise(promise, options);
  },
};

export default toastService;
