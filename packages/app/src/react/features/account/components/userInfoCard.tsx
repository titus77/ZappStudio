import { teamAPI } from '@react/features/teams/clients';
import { DeleteAccountType } from '@src/react/features/account/enum';
import BlockAccountDeleteModal from '@src/react/features/account/modal/block-account-delete';
import DeleteAccountModal from '@src/react/features/account/modals/deleteAccountModal';
import { Button as CustomButton } from '@src/react/shared/components/ui/newDesign/button';
import { useAuthCtx } from '@src/react/shared/contexts/auth.context';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const UserInfoCard = () => {
  const {
    userInfo: { subs, user },
  } = useAuthCtx();

  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [blockAccountDeleteModalOpen, setBlockAccountDeleteModalOpen] = useState(false);
  const [userName, setUserName] = useState(user.name || 'User');
  const [loadingUserName, setLoadingUserName] = useState(true); // New loading state

  useEffect(() => {
    // Fetch user data if user.name does not exist
    if (!user.name) {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/page/onboard/get-data');
          const data = await response.json();
          if (data && data.name) {
            setUserName(data.name);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoadingUserName(false); // Set loading to false after fetching
        }
      };

      fetchUserData();
    } else {
      setLoadingUserName(false); // If user.name exists, set loading to false
    }
  }, [user.name]);

  const teamMembersQuery = useQuery({
    queryKey: ['team_members_list'],
    queryFn: () => teamAPI.getTeamMembers(),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const isActiveSubscription = (subs) => {
    return (
      (subs.object?.status === 'active' || subs.object?.status === 'past_due') &&
      !subs.object?.cancel_at_period_end &&
      subs.plan?.paid
    );
  };

  const deleteAccRequirements = [
    {
      title: 'Vous n\'avez pas les droits pour supprimer ce compte.',
      type: DeleteAccountType.IS_NOT_TEAM_OWNER,
      bool: !user.userTeamRole.isTeamInitiator,
      error:
        'Veuillez contacter le proprietaire du compte. Vous pouvez le retrouver sur la page Membres. Besoin d\'aide ? Contactez le support.',
    },
    {
      title: 'Suppression du compte bloquee',
      type: DeleteAccountType.USER_HAS_TEAM_MEMBERS_AND_SUBSCRIPTION,
      bool:
        !teamMembersQuery.isLoading &&
        teamMembersQuery.data?.members?.length > 1 &&
        isActiveSubscription(subs),
      error: 'Votre compte ne peut pas etre supprime tant que vous avez des membres actifs.',
      steps: [
        'Retirez tous les membres de votre equipe',
        'Puis annulez votre abonnement depuis <a href="/my-plan">la page Mon abonnement</a>',
        'Contactez le support si besoin',
      ],
    },
    {
      title: 'Suppression du compte bloquee',
      type: DeleteAccountType.USER_HAS_TEAM_MEMBERS,
      bool: !teamMembersQuery.isLoading && teamMembersQuery.data?.members?.length > 1,
      error: 'Votre compte ne peut pas etre supprime tant que vous avez des membres actifs.',
      isLoading: teamMembersQuery.isLoading,
      steps: [
        'Retirez tous les membres de votre equipe',
        'Contactez le support si besoin',
      ],
    },
    {
      title: 'Suppression du compte bloquee',
      type: DeleteAccountType.USER_HAS_SUBSCRIPTION,
      bool: isActiveSubscription(subs),
      error:
        'Votre compte ne peut pas etre supprime tant que vous avez un abonnement actif. Pour continuer, <a href="/my-plan">cliquez ici</a> pour annuler votre abonnement.',
    },
  ];

  const deleteAccConditionsLoading = deleteAccRequirements.some((req) => req.isLoading);
  const deleteAccRequirement = deleteAccRequirements.find((req) => req.bool);
  const canDeleteAccount = deleteAccRequirements.every((req) => !req.bool);

  const deleteBtn = (
    <CustomButton
      className="mt-5 rounded-sm"
      handleClick={() =>
        canDeleteAccount ? setDeleteAccountModalOpen(true) : setBlockAccountDeleteModalOpen(true)
      }
      fullWidth
    >
      Supprimer le compte
    </CustomButton>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex justify-center items-center">
            <div className="text-center flex flex-col items-center justify-center">
              <h5 className="text-lg font-semibold">Profil utilisateur</h5>
              <img
                className="pb-2 mt-3 min-w-[85px]"
                src={user.avatar || '/img/user_default.svg'}
                alt="Photo de profil"
              />
              <div className="text-xl font-semibold" id="user-name">
                {loadingUserName ? 'Chargement...' : userName} {/* Show loading text */}
              </div>
              <span>{user.email}</span>
              {user?.createdAt && (
                <p className="mt-3 ">
                  <b className="text-xs">Membre depuis : </b>
                  <span className="text-xs">
                    {Intl.DateTimeFormat('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(user.createdAt))}
                  </span>
                </p>
              )}

              {/* Delete account button */}

              {deleteAccConditionsLoading ? (
                <div className="h-10 w-full shadow rounded-lg text-sm animate-pulse mt-5 bg-gray-200 dark:bg-gray-700"></div>
              ) : (
                deleteBtn
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteAccountModalOpen &&
        createPortal(
          <DeleteAccountModal
            onClose={() => {
              setDeleteAccountModalOpen(false);
            }}
          />,
          document.body,
        )}

      {blockAccountDeleteModalOpen &&
        createPortal(
          <BlockAccountDeleteModal
            deleteAccRequirement={deleteAccRequirement}
            handleToggle={setBlockAccountDeleteModalOpen}
          />,
          document.body,
        )}
    </>
  );
};

export default UserInfoCard;
