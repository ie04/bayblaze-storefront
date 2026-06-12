import Header from "@/app/components/layout/Header";
import {
  MailLineIcon,
  MessageCircleLineIcon,
  TruckLineIcon,
} from "@/app/components/icons/SharpIcons";

export const metadata = {
  title: "Contact · BayBlaze Tampa",
  description:
    "Reach BayBlaze for order questions, delivery help, and product recommendations in Tampa.",
};

const contactCards = [
  {
    icon: <MessageCircleLineIcon />,
    label: "Order support",
    value: "Reply to your order text",
  },
  {
    icon: <TruckLineIcon />,
    label: "Delivery hours",
    value: "Daily · 10am–11pm",
  },
  {
    icon: <MailLineIcon />,
    label: "Email",
    value: "contact@bayblaze.net",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header surface="solid" />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
          Contact
        </p>

        <h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-5xl">
          Talk to BayBlaze
        </h1>

        <p className="mt-3 max-w-xl text-base font-medium leading-[1.6] text-[#585858]">
          Order issue, delivery question, or local product recommendation — send it our way.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {contactCards.map((card) => (
            <div key={card.label} className="bayblaze-sharp-card bg-white p-5">
              <div className="grid h-10 w-10 place-items-center border-2 border-black bg-[var(--ast-global-color-4)]">
                {card.icon}
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-widest text-[#585858]">
                {card.label}
              </div>
              <div className="mt-1 text-base font-bold leading-tight text-black">
                {card.value}
              </div>
            </div>
          ))}
        </div>

        <form
          className="bayblaze-sharp-card mt-8 bg-white p-6"
          action="mailto:contact@bayblaze.net"
          method="post"
          encType="text/plain"
        >
          <h2 className="text-lg font-bold uppercase tracking-wide">
            Send a message
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest">
                Name
              </span>
              <input className="bayblaze-sharp-input" name="name" required />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest">
                Email
              </span>
              <input className="bayblaze-sharp-input" name="email" type="email" required />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest">
                Message
              </span>
              <textarea className="bayblaze-sharp-input" name="message" rows={5} required />
            </label>
          </div>

          <button className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-4">
            Send message
          </button>
        </form>
      </div>
    </main>
  );
}
