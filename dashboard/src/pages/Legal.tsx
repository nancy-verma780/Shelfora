import type { ReactNode } from "react";
import { SITE } from "../data/site";
import { useStore } from "../state/StoreContext";

function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl pb-8">
      <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] sm:text-[36px]">{title}</h1>
      <p className="mt-2 text-sm text-ink3">Last updated: {SITE.legalUpdated}</p>
      <div className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-ink2">{children}</div>
    </article>
  );
}
const S = ({ h, children }: { h: string; children: ReactNode }) => (
  <section>
    <h2 className="mb-2 font-display text-lg font-bold text-ink">{h}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);
const Mail = () => <a className="font-medium text-teal underline underline-offset-2" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

export function Terms() {
  const { go } = useStore();
  return (
    <Doc title="Terms and Conditions">
      <p>
        These terms apply to the Shelfora website at {SITE.siteUrl.replace("https://", "")} and to the Shelfora source code
        published on GitHub. By using the website or the code, you agree to these terms. If you do not agree, please do not use them.
      </p>
      <S h="1. What Shelfora is">
        <p>
          Shelfora is a student prototype built by {SITE.team}, {SITE.institution}. It demonstrates how a store’s existing
          CCTV cameras and an object-detection model could be used to estimate shelf stock and suggest which products to refill first.
        </p>
        <p>
          It is not a commercial product or service. There are no paid plans, user accounts or customer support commitments.
        </p>
      </S>
      <S h="2. Demo data">
        <p>
          The website runs on a fictional demo store. Products, stock levels, sales figures, alerts, trends and other numbers
          shown on the dashboard are sample data created for demonstration. They do not describe any real store or company.
        </p>
        <p>
          The figures on the Vision Model page are measured results of the detection model on a public research dataset, under the
          conditions described on that page. They may not reflect performance in another store or setting.
        </p>
      </S>
      <S h="3. No warranty">
        <p>
          Shelfora is provided “as is”, without warranties of any kind, express or implied, including fitness for a particular
          purpose, accuracy or availability. Detection models make mistakes. Do not rely on Shelfora as the only basis for
          stock, safety, financial or business decisions.
        </p>
      </S>
      <S h="4. Using the vision server with real cameras">
        <p>
          The optional vision server runs on hardware you control. If you connect it to real cameras, you are responsible for
          having the right to process that footage, for giving any notices to customers and staff that the law requires, and for
          storing and deleting footage appropriately. The Shelfora website does not receive your camera footage or sales data.
        </p>
      </S>
      <S h="5. Acceptable use">
        <p>
          Do not use Shelfora to identify, track or profile individual people, to break any law, or to try to disrupt the website
          or the services it runs on.
        </p>
      </S>
      <S h="6. Intellectual property">
        <p>
          The Shelfora name, design and source code belong to their authors. Viewing the code on GitHub does not grant a licence to
          copy or reuse it unless a licence file in the repository says otherwise. Third-party libraries, fonts and icons remain
          under their own licences.
        </p>
        <p>
          The included detection model was trained on public datasets that are licensed for research and non-commercial use, so the
          model may only be used on the same terms.
        </p>
      </S>
      <S h="7. Limitation of liability">
        <p>
          To the extent the law allows, the authors are not liable for any loss or damage arising from the use of, or inability to
          use, the website, the source code or the model.
        </p>
      </S>
      <S h="8. Changes and governing law">
        <p>
          These terms may change as the project develops; the date at the top shows the latest version. These terms are governed
          by the laws of India.
        </p>
      </S>
      <S h="9. Contact">
        <p>Questions about these terms: <Mail />.</p>
        <p>
          See also the{" "}
          <button className="font-medium text-teal underline underline-offset-2" onClick={() => go("privacy")}>Privacy Policy</button>.
        </p>
      </S>
    </Doc>
  );
}

export function Privacy() {
  const { go } = useStore();
  return (
    <Doc title="Privacy Policy">
      <p>
        This policy explains what information the Shelfora website handles. In short: Shelfora has no accounts, no sign-up forms,
        no advertising and no analytics trackers, and it does not ask you for personal information.
      </p>
      <S h="1. Information stored in your browser">
        <p>Shelfora saves two settings in your browser’s local storage so the site remembers them on your device:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>your light or dark mode choice;</li>
          <li>the address of a Shelfora vision server, only if you connect one in Settings.</li>
        </ul>
        <p>
          These settings stay on your device and are not sent to us. You can remove them by clearing this site’s data in your
          browser. Shelfora does not set cookies.
        </p>
      </S>
      <S h="2. Hosting and fonts">
        <p>
          The website is hosted by Vercel. Like most web hosts, Vercel processes technical information such as your IP address,
          browser type and request times to deliver the site and keep it secure, as described in Vercel’s own privacy policy.
        </p>
        <p>
          Fonts are loaded from Google Fonts, so your browser contacts Google’s servers when the page loads, as described in
          Google’s privacy policy.
        </p>
      </S>
      <S h="3. Connecting a store server">
        <p>
          If you connect a Shelfora vision server, your browser talks directly to the address you enter. Camera footage, stock
          data and sales data stay on that server, under the control of whoever runs it. The Shelfora website does not receive,
          store or share them.
        </p>
      </S>
      <S h="4. Demo data">
        <p>
          The products, figures and staff names shown in the demo store are fictional. No real customer or employee data is used.
        </p>
      </S>
      <S h="5. Your rights">
        <p>
          Because we do not collect personal information through the website, there is normally nothing for us to access, correct
          or delete. If you contact us by email, we use your message only to reply, and you can ask us to delete it at any time.
          We aim to handle personal data in line with applicable Indian law, including the Digital Personal Data Protection Act, 2023.
        </p>
      </S>
      <S h="6. Changes">
        <p>If this policy changes, the date at the top will be updated.</p>
      </S>
      <S h="7. Contact">
        <p>Questions about privacy: <Mail />.</p>
        <p>
          See also the{" "}
          <button className="font-medium text-teal underline underline-offset-2" onClick={() => go("terms")}>Terms and Conditions</button>.
        </p>
      </S>
    </Doc>
  );
}
