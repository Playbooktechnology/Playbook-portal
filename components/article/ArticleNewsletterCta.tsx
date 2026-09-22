import { NewsletterForm } from '@/components/shared/NewsletterForm';

// The article-page equivalent of the homepage's mid-scroll newsletter CTA
// (components/sections/MidCta.tsx) — same mechanism (NewsletterForm
// posting to Substack), fixed copy instead of CMS-editable: it has to sit
// inside the narrow reading column (.article-body, 68ch) rather than a
// full-bleed section, so it needs its own layout, not MidCta's.
//
// Sells the newsletter itself, not just "suscríbete" — the reader is mid-
// article, already sold on Playbook's angle on this one story; the ask is
// to get the same read on every story, every week.
export function ArticleNewsletterCta() {
  return (
    <aside className="article-newsletter-cta">
      <div className="article-newsletter-cta-copy">
        <h2>
          Si te interesa entender <em>el backstage del negocio del deporte</em>
        </h2>
        <p>Recibe Playbook gratis en tu correo, cada semana.</p>
      </div>
      <NewsletterForm
        placement="article-mid"
        formClassName="article-newsletter-cta-form"
        action="https://playbookmedia.substack.com/subscribe"
        emailId="nl-email-article"
        emailLabel="Correo electrónico"
        buttonLabel="Suscríbete gratis"
        successMessage="Te abrimos Substack para confirmar tu suscripción."
      />
    </aside>
  );
}
