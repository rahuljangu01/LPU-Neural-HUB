import Swal from 'sweetalert2';

// 1. Success Toast (Top Right)
export const successToast = (msg) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: msg,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#0a0a0a',
    color: '#fff',
    iconColor: '#ef4444', // Red icon for success too to match theme
    showClass: {
      popup: 'animate__animated animate__fadeInRight'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutRight'
    }
  });
};

// 2. Error Alert (Pop up)
export const errorAlert = (title, msg) => {
  Swal.fire({
    icon: 'error',
    title: `<span style="color:#fff; font-family:Outfit; font-weight:900; text-transform:uppercase italic"> ${title} </span>`,
    text: msg,
    background: '#0a0a0a',
    color: '#94a3b8',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'rounded-[2rem] border-2 border-red-900/30 shadow-2xl',
      confirmButton: 'rounded-xl font-black uppercase text-[10px] px-8 py-3'
    },
    showClass: {
      popup: 'animate__animated animate__zoomIn'
    }
  });
};

// 3. Confirm Dialog (The Part You Needed Fixed)
export const confirmDialog = async (title, text) => {
  const res = await Swal.fire({
    title: `<span style="color:#fff; font-family:Outfit; font-weight:900; text-transform:uppercase italic"> ${title} </span>`,
    html: `<p style="color:#94a3b8; font-weight:bold; font-size:14px;">${text}</p>`,
    icon: 'warning',
    iconColor: '#ef4444',
    background: '#0a0a0a',
    showCancelButton: true,
    confirmButtonColor: '#ef4444', // RED Button
    cancelButtonColor: '#1e293b',  // DARK SLATE Button
    confirmButtonText: 'YES, DO IT',
    cancelButtonText: 'Cancle',
    reverseButtons: true, // Cancel left, Confirm right
    focusConfirm: false,
    customClass: {
      popup: 'rounded-[3rem] border-2 border-red-900/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]',
      confirmButton: 'rounded-2xl font-black uppercase text-[10px] px-6 py-4 tracking-widest shadow-lg shadow-red-900/40',
      cancelButton: 'rounded-2xl font-black uppercase text-[10px] px-6 py-4 tracking-widest'
    },
    showClass: {
      popup: 'animate__animated animate__backInDown' // Smooth entrance
    },
    hideClass: {
      popup: 'animate__animated animate__backOutUp' // Smooth exit
    }
  });
  return res.isConfirmed;
};