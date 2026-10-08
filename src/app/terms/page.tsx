import { PilotNote } from "@/components/ui";
export default function Terms() {
  return (
    <article className="prose">
      <h1>Marketplace terms / beta</h1>
      <p>
        These initial operating rules require business and legal review before
        public launch. PADROOM is independent of Sony, Microsoft and Nintendo.
      </p>
      <h2>Listing rules</h2>
      <p>
        List only equipment you are entitled to sell. Describe condition and
        defects accurately. Upload photographs you have rights to use. No stolen
        goods, account sharing, PSN account resale, illegal game keys or
        unsupported warranty claims. Only physical games are accepted.
      </p>
      <h2>Conduct</h2>
      <p>
        Do not harass, impersonate, spam or attempt to access someone else’s
        private records. Inventory may be rejected or removed and abusive
        accounts suspended. Reports are reviewed by administrators.
      </p>
      <h2>Requests and handover</h2>
      <p>
        A purchase or trade request records intent. Confirm completion only
        after the agreed handover. Payment, delivery, inspection and any
        disputes are arranged separately between participants. The operator must
        publish eligibility, refund, dispute, prohibited-item and support
        policies before public launch.
      </p>
      <PilotNote />
    </article>
  );
}
