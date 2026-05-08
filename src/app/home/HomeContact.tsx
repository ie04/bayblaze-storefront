export default function HomeContact() {
  return (
    <section
      id="contact"
      className="bayblaze-home-contact flex justify-center px-5 py-24 md:px-[200px] md:py-[200px]"
      style={{
        backgroundImage:
          "url('https://bayblaze.net/wp-content/uploads/2026/03/lookandlearn.com-YB0028329-1-scaled.jpg')",
      }}
    >
      <div className="w-full max-w-[780px] bg-white/85 px-5 py-6 text-center">
        <h2 className="bayblaze-contact-title">Contact US</h2>
        <p className="mx-auto mt-3 max-w-[610px] text-[17px] font-bold leading-[1.7] text-[#585858]">
          If you have any questions, concerns, or product recommendations please
          reach out to us. You can contact us by email or phone.
        </p>
        <a
          href="mailto:contact@bayblaze.net"
          className="bayblaze-hero-button mt-[25px] inline-flex rounded-[3px] bg-[var(--ast-global-color-1)] px-5 py-2.5 text-center text-white transition-colors hover:bg-[var(--ast-global-color-0)]"
        >
          REACH OUT
        </a>
      </div>
    </section>
  );
}
