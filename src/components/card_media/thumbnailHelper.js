// thumbnailHelper.js

export function generateVideoThumbnail(src, seekTo = 1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.onloadeddata = () => {
      // Vai a un fotogramma "sicuro"
      video.currentTime = Math.min(seekTo, video.duration || seekTo);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('No blob from canvas'));
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/jpeg');
    };

    video.onerror = (err) => reject(err);
  });
}
