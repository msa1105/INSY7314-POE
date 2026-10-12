/**
 * photos.js – Stock photography used in the UI.
 *
 * The files live in /public/images and are served from our own origin, so the
 * strict Content Security Policy (img-src 'self') still applies. Each photo is
 * free to use under the Unsplash License; the photographer is credited on the
 * page where the photo appears.
 */

/* Unsplash, n.d.
 * License
 * Unsplash
 * https://unsplash.com/license
 * Accessed: 11 October 2026
 */

/* Toa Heftiba, 2018
 * Cup of coffee, laptop computer, and red earphones plugged in laptop on brown wooden table
 * Unsplash
 * https://unsplash.com/photos/cup-of-coffee-laptop-computer-and-red-earphones-plugged-in-laptop-on-brown-wooden-table-W6q15ddqqJo
 * Accessed: 11 October 2026
 */
/* Good Faces, 2021
 * Woman in gray sweater sitting on chair using macbook
 * Unsplash
 * https://unsplash.com/photos/woman-in-gray-sweater-sitting-on-chair-using-macbook-gy5SlRW9OGA
 * Accessed: 11 October 2026
 */
/* Daniel Thomas, 2020
 * Person using black and silver laptop computer
 * Unsplash
 * https://unsplash.com/photos/person-using-black-and-silver-laptop-computer-6_NXEMZbUq0
 * Accessed: 11 October 2026
 */

export const PHOTOS = {
  hero: {
    src: '/images/hero-workspace.jpg',
    alt: 'A laptop, a cup of coffee and earphones on a wooden desk',
    author: 'Toa Heftiba',
    link: 'https://unsplash.com/photos/cup-of-coffee-laptop-computer-and-red-earphones-plugged-in-laptop-on-brown-wooden-table-W6q15ddqqJo',
  },
  login: {
    src: '/images/auth-login.jpg',
    alt: 'A freelancer working on a laptop by a window',
    author: 'Good Faces',
    link: 'https://unsplash.com/photos/woman-in-gray-sweater-sitting-on-chair-using-macbook-gy5SlRW9OGA',
  },
  register: {
    src: '/images/auth-register.jpg',
    alt: 'Hands typing on a laptop keyboard',
    author: 'Daniel Thomas',
    link: 'https://unsplash.com/photos/person-using-black-and-silver-laptop-computer-6_NXEMZbUq0',
  },
}
