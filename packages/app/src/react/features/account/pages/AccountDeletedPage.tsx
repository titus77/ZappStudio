import { useEffect, useState } from 'react';

const AccountDeletedPage = () => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (countdown === 0) {
      window.location.href = '/logto/sign-out';
    }
  }, [countdown]);
  
  return (
    <div className="container mx-auto p-8 font-sans h-screen flex items-center justify-center">
      <div className="px-8 py-16 bg-white text-gray-900 w-full md:w-1/2 flex items-center justify-center rounded-lg font-sans font-medium flex-col">
        <h3 className="text-xl text-center">
          Votre compte a été supprimé. Nous sommes désolés de vous voir partir.
        </h3>

        <p className="text-center mt-4">
          Si vous avez des commentaires ou besoin d'aide, contactez-nous à{' '}
          <a href="mailto:hello@zapp.immo" className="text-primary-100">
            hello@zapp.immo
          </a>
          .
        </p>
        <h3 className="mt-20">Veuillez patienter pendant la redirection vers la page de connexion.</h3>
        <h3 className="text-center">{countdown} secondes restantes...</h3>
      </div>
    </div>
  );
};

export default AccountDeletedPage;
