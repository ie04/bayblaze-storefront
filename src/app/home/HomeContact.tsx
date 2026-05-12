export default function HomeContact() {
  return (
    <section
      id="contact"
      className="bayblaze-home-contact flex justify-center border-b-2 border-black px-4 py-20 sm:px-5 sm:py-24 md:px-[200px] md:py-[160px]"
    >
      <div aria-hidden="true" className="bayblaze-home-contact-bg" />
      <div className="w-full max-w-[780px] border-2 border-black bg-white/85 px-4 py-7 text-center sm:px-5 sm:py-8">
        <h2 className="bayblaze-contact-title">Contact US</h2>
        <p className="mx-auto mt-3 max-w-[610px] text-[16px] font-semibold leading-[1.6] text-[#585858] sm:text-[17px] sm:font-bold sm:leading-[1.7]">
          If you have any questions, concerns, or product recommendations please
          reach out to us. You can contact us by email or phone.
        </p>
        <a
          href="mailto:contact@bayblaze.net"
          className="bayblaze-hero-button mt-[25px] inline-flex rounded-[3px] border border-black bg-[var(--ast-global-color-1)] px-5 py-2.5 text-center text-white transition-colors hover:bg-[var(--ast-global-color-0)]"
        >
          REACH OUT
        </a>
      </div>
    </section>
  );
}
