// Decorative skyline for the log-in / sign-up art (the app never shows these as real stores).
export const DEMO_SKYLINE = [
  ['Corner Bakery', 4.8], ['Pixel Arcade', 4.2], ['Green Leaf Grocers', 4.6], ['Night Owl Books', 3.9],
  ['Copper Kettle', 4.4], ['Bright Optics', 3.2], ['Urban Threads', 4.0], ['Spoke & Chain', 4.7],
  ['Sunrise Pharmacy', 3.6], ['Velvet Records', 4.9], ['Fresh Catch', 2.8], ['Paper Crane', 4.3],
  ['Iron Gym', 3.4], ['Harbor Coffee', 4.5], ['Tiny Toys', 3.8], ['Nova Mobiles', 3.0],
].map(([name, rating]) => ({ name, rating, count: 0 }));
