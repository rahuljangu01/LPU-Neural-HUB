import Swal from 'sweetalert2';

// 1. SUCCESS TOAST - Simple & Clean
export const successToast = (msg) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: msg,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#0f172a',
    color: '#fff',
    customClass: {
      popup: '!rounded-xl !shadow-2xl !border !border-emerald-500/30'
    },
    showClass: {
      popup: 'animate__animated animate__slideInRight'
    },
    hideClass: {
      popup: 'animate__animated animate__slideOutRight'
    }
  });
};

// 2. ERROR ALERT - Clean Popup
export const errorAlert = (title, msg) => {
  Swal.fire({
    icon: 'error',
    title: `<span style="color:#fff; font-family:system-ui; font-weight:800; font-size:18px;">${title}</span>`,
    html: `<p style="color:#94a3b8; font-weight:500;">${msg}</p>`,
    background: '#0f172a',
    color: '#fff',
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Got It',
    customClass: {
      popup: '!rounded-2xl !border !border-red-500/30 !shadow-2xl',
      confirmButton: '!rounded-lg !font-bold !px-6 !py-2.5'
    },
    showClass: {
      popup: 'animate__animated animate__zoomIn'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut'
    },
    backdrop: 'rgba(0,0,0,0.7)'
  });
};

// 3. CONFIRM DIALOG - Clean & Simple
export const confirmDialog = async (title, text) => {
  const result = await Swal.fire({
    icon: 'question',
    iconColor: '#f59e0b',
    title: `<span style="color:#fff; font-family:system-ui; font-weight:800;">${title}</span>`,
    html: `<p style="color:#94a3b8; font-weight:500;">${text}</p>`,
    background: '#0f172a',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    customClass: {
      popup: '!rounded-2xl !border !border-amber-500/30 !shadow-2xl',
      confirmButton: '!rounded-lg !font-bold !px-6 !py-2.5',
      cancelButton: '!rounded-lg !font-bold !px-6 !py-2.5'
    },
    showClass: {
      popup: 'animate__animated animate__zoomIn'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut'
    },
    backdrop: 'rgba(0,0,0,0.7)'
  });
  return result.isConfirmed;
};

// 4. INFO TOAST
export const infoToast = (msg) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    iconColor: '#3b82f6',
    title: msg,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background: '#0f172a',
    color: '#fff',
    customClass: {
      popup: '!rounded-xl !shadow-2xl !border !border-blue-500/30'
    },
    showClass: {
      popup: 'animate__animated animate__slideInRight'
    },
    hideClass: {
      popup: 'animate__animated animate__slideOutRight'
    }
  });
};

// 5. WELCOME TOAST - Simple for All Users
export const welcomeToast = (name) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    iconColor: '#10b981',
    title: `Welcome ${name}!`,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    background: '#0f172a',
    color: '#fff',
    customClass: {
      popup: '!rounded-xl !shadow-2xl !border !border-emerald-500/30'
    },
    showClass: {
      popup: 'animate__animated animate__slideInRight'
    },
    hideClass: {
      popup: 'animate__animated animate__slideOutRight'
    }
  });
};

// 6. WARNING TOAST
export const warningToast = (msg) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'warning',
    iconColor: '#f59e0b',
    title: msg,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    background: '#0f172a',
    color: '#fff',
    customClass: {
      popup: '!rounded-xl !shadow-2xl !border !border-amber-500/30'
    },
    showClass: {
      popup: 'animate__animated animate__slideInRight'
    },
    hideClass: {
      popup: 'animate__animated animate__slideOutRight'
    }
  });
};
