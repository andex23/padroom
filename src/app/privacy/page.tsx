export default function Privacy() {
  return (
    <article className="prose">
      <h1>Privacy / beta notice</h1>
      <p>
        This operational notice requires business and legal review before public
        launch.
      </p>
      <h2>Information used by the marketplace</h2>
      <p>
        Supabase stores your email and authentication session. PADROOM stores
        your display name, selected city, listings and photos, saved items,
        private conversations, requests and reports. We do not collect
        government identity documents, card numbers or bank details.
      </p>
      <h2>Who can access it</h2>
      <p>
        Approved active listings and their photos are publicly visible. Your
        email is not displayed on listings. Saved items belong to you.
        Conversations and requests are visible only to their participants.
        Administrators review listing submissions, reports and account status;
        they cannot browse private messages through this application.
      </p>
      <h2>Cookies and control</h2>
      <p>
        Authentication cookies maintain your session. Sign out on shared
        devices. You can edit your profile, remove saves and archive listings.
        The operator must publish a support contact, retention schedule,
        deletion-request procedure and data controller details before public
        launch. This notice does not assert regulatory certification.
      </p>
    </article>
  );
}
