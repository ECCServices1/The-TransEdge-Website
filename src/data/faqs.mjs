/**
 * The questions people actually ask before a first visit.
 *
 * One list, read by two pages. Plan Your Visit shows the first six, because a
 * page whose job is a confident yes in under 60 seconds cannot carry sixteen
 * answers. The FAQ page shows all of them.
 *
 * Only the FAQ page emits FAQPage structured data. Two pages emitting schema
 * for overlapping question sets is how a site ends up competing with itself in
 * search results.
 *
 * Everything here is answerable from what the church already publishes about
 * itself: the service times, the address, the building, the welcome process.
 * Anything that needed a pastor to decide it is not in this file.
 */

/**
 * @typedef {object} Faq
 * @property {string} question
 * @property {string} answer
 * @property {'visit'|'practical'|'belief'|'children'|'money'} group
 * @property {boolean} [lead] Shown in the short set on Plan Your Visit.
 */

/** @type {Faq[]} */
export const FAQS = [
  {
    question: 'What do people wear?',
    answer:
      'Whatever you are comfortable in. You will see everything from a suit to shorts on the same row.',
    group: 'visit',
    lead: true,
  },
  {
    question: 'Will I be singled out?',
    answer:
      'No. We do not ask visitors to stand, introduce themselves or put a hand up. Nobody will ask you for money.',
    group: 'visit',
    lead: true,
  },
  {
    question: 'What happens with my kids?',
    answer:
      'EdgeKids runs during the gathering for school-age children, with screened and trained leaders. Younger children are welcome to stay with you, and there is space at the back if you need to move around.',
    group: 'children',
    lead: true,
  },
  {
    question: 'How long does it go for?',
    answer: 'About an hour and a half, including time afterwards for a cup of tea.',
    group: 'visit',
    lead: true,
  },
  {
    question: 'Is the building accessible?',
    answer:
      'The main entrance and the auditorium are step-free, and there is an accessible toilet. If you need anything specific, call us before you come and we will sort it out.',
    group: 'practical',
    lead: true,
  },
  {
    question: 'What if I am not religious?',
    answer:
      'You are welcome exactly as you are. Plenty of people here came for the first time not knowing what they thought, and that is a completely normal way to arrive.',
    group: 'belief',
    lead: true,
  },

  /* Everything below is on the FAQ page only. */

  {
    question: 'Do I need to book?',
    answer:
      'No. Nothing is booked and nothing is needed. Turn up on a Sunday and come in.',
    group: 'visit',
  },
  {
    question: 'Can I come on my own?',
    answer:
      'Yes, and many people do. Tell the welcome desk it is your first day and someone will sit with you if you would like, or leave you to it if you would rather.',
    group: 'visit',
  },
  {
    question: 'Where do I park?',
    answer:
      'There is parking on site and on the street around Harford Street. Come a few minutes early on a Sunday and you will have your pick.',
    group: 'practical',
  },
  {
    question: 'What time should I arrive?',
    answer:
      'About ten minutes before the start is comfortable. It gives you time to park, find a seat and get a coffee without feeling rushed.',
    group: 'practical',
  },
  {
    question: 'Is there anything for teenagers?',
    answer:
      'Yes. Ask at the welcome desk on the day and someone will point you to the right person, who can tell you what runs and when.',
    group: 'children',
  },
  {
    question: 'Do I have to give money?',
    answer:
      'No. There is an offering during the gathering and you are under no obligation whatsoever to take part in it. Visitors are not asked to give, and nobody watches who does.',
    group: 'money',
  },
  {
    question: 'What language is the gathering in?',
    answer:
      'English. Our congregation comes from many countries and many first languages, and the Sunday gathering is in English.',
    group: 'visit',
  },
  {
    question: 'Can I bring a friend who is not a Christian?',
    answer:
      'Yes. Nobody is put on the spot, and nothing in the morning depends on already believing something.',
    group: 'belief',
  },
  {
    question: 'What if I have to leave early?',
    answer:
      'Then leave early. Sit near the back if that makes it easier, and go when you need to. Nobody will mind or ask why.',
    group: 'visit',
  },
  {
    question: 'Can I talk to someone afterwards?',
    answer:
      'Yes. There are people available after every gathering, and you can also ask for prayer or get in touch during the week if that suits you better.',
    group: 'belief',
  },
];

/** The short set, for a page that cannot afford the full list. */
export const LEAD_FAQS = FAQS.filter((faq) => faq.lead);

/** @type {{ key: Faq['group'], title: string }[]} */
export const FAQ_GROUPS = [
  { key: 'visit', title: 'Coming for the first time' },
  { key: 'practical', title: 'Getting here and getting in' },
  { key: 'children', title: 'Children and teenagers' },
  { key: 'belief', title: 'Belief and belonging' },
  { key: 'money', title: 'Money' },
];
