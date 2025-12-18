import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  return null; // Не показываем ошибку
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  // Игнорируем NotFoundError
  if (err && (err.name === 'NotFoundError' || err.message?.includes('can not be found here'))) {
    return { statusCode: 200 }; // Возвращаем 200 вместо ошибки
  }

  return { statusCode };
};

export default Error;
