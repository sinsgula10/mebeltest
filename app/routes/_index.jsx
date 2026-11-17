import {QuizLanding} from '~/components/QuizLanding';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {
      title:
        'Top1Mebel Krg | Кухни на заказ в Караганде и бесплатный 3D-дизайн',
    },
    {
      name: 'description',
      content:
        'Рассчитайте стоимость кухни на заказ за 60 секунд в тенге и получите бесплатный 3D-дизайн проект от Top1Mebel Krg в Караганде.',
    },
  ];
};

export default function Homepage() {
  return <QuizLanding heroImage="/images/kitchen-hero.jpg" />;
}

/** @typedef {import('./+types/_index').Route} Route */
