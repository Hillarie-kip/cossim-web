import toast from 'react-hot-toast';

const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast(message),
  loading: (message) => toast.loading(message),
  dismiss: () => toast.dismiss(),
  custom: (message, options) => toast(message, options),
};

export default notify;
