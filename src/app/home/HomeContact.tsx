export default function HomeContact() {
  return (
    <section
      id="contact"
      className="bayblaze-home-contact flex justify-center border-b-2 border-black px-4 py-16 sm:px-5 sm:py-20"
    >
      <div aria-hidden="true" className="bayblaze-home-contact-bg" />
      <div className="w-full max-w-[780px] border-2 border-black bg-white/95 px-5 py-8 text-center sm:px-8 sm:py-10">
        <h2 className="bayblaze-contact-title">Contact Us</h2>
        <p className="mx-auto mt-3 max-w-[610px] text-[16px] font-semibold leading-[1.6] text-[#585858] sm:text-[17px] sm:leading-[1.7]">
          If you have any questions, concerns, or product recommendations please
          reach out to us. You can contact us by email or phone.
        </p>
        <a
          href="/contact"
          className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-6"
        >
          REACH OUT
        </a>
      </div>
    </section>
  );
}
