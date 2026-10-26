export type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  half?: boolean;
  hint?: string;
};

export type FormKind = "casting" | "partner" | "press" | "access" | "subscribe";

const CASTING: Field[] = [
  { name: "name", label: "Имя и фамилия", required: true, autoComplete: "name", half: true },
  { name: "age", label: "Возраст", type: "number", required: true, half: true },
  { name: "city", label: "Город", required: true, autoComplete: "address-level2", half: true },
  { name: "height", label: "Рост, см", type: "number", required: true, half: true },
  { name: "params", label: "Параметры", placeholder: "90 / 60 / 90", half: true },
  { name: "contact", label: "Telegram или телефон", required: true, half: true },
  {
    name: "links",
    label: "Ссылка на снэпы или видео-визитку",
    type: "url",
    placeholder: "https://",
    hint: "Подойдёт папка на диске, профиль или облако. Снэпы — без макияжа и обработки.",
  },
];

const PARTNER: Field[] = [
  { name: "company", label: "Бренд или компания", required: true, half: true },
  { name: "name", label: "Контактное лицо", required: true, autoComplete: "name", half: true },
  { name: "contact", label: "Почта или Telegram", required: true, half: true },
  { name: "format", label: "Формат сотрудничества", placeholder: "Коллекция, интеграция, медиа", half: true },
  { name: "message", label: "Коротко о задаче", type: "textarea" },
];

const PRESS: Field[] = [
  { name: "name", label: "Имя и фамилия", required: true, autoComplete: "name", half: true },
  { name: "outlet", label: "Издание или площадка", required: true, half: true },
  { name: "link", label: "Ссылка на профиль или медиа", type: "url", required: true, placeholder: "https://", half: true },
  { name: "reach", label: "Охват аудитории", placeholder: "Подписчики или просмотры", half: true },
  { name: "contact", label: "Почта или Telegram", required: true, autoComplete: "email" },
];

const ACCESS: Field[] = [
  { name: "name", label: "Имя", required: true, autoComplete: "name", half: true },
  {
    name: "contact",
    label: "Почта или телефон",
    required: true,
    autoComplete: "email",
    half: true,
    placeholder: "you@mail.ru",
  },
];

const SUBSCRIBE: Field[] = [
  {
    name: "contact",
    label: "Почта",
    type: "email",
    required: true,
    autoComplete: "email",
    placeholder: "you@mail.ru",
  },
];

export const FIELDS: Record<FormKind, Field[]> = {
  casting: CASTING,
  partner: PARTNER,
  press: PRESS,
  access: ACCESS,
  subscribe: SUBSCRIBE,
};

export const SUBMIT: Record<FormKind, string> = {
  casting: "Отправить заявку",
  partner: "Отправить запрос",
  press: "Запросить аккредитацию",
  access: "Получить доступ первым",
  subscribe: "Подписаться",
};

export const DONE: Record<FormKind, string> = {
  casting: "Заявка отправлена. Мы ответим на указанный контакт.",
  partner: "Запрос отправлен. Мы свяжемся с вами по указанному контакту.",
  press: "Заявка на аккредитацию отправлена. Ответим до показа.",
  access: "Готово. Вы получите ссылку на билеты первыми.",
  subscribe: "Готово. Новости показа придут на указанную почту.",
};
