import { SubscriptionsPricingCards } from "@/components/SubscriptionsPricingCards";

const SubscriptionsPage = () => {
  return (
    <main className="clerk-subscriptions">
      <section className="mx-auto max-w-3xl space-y-4">
        <h1 className="page-title-xl text-center">Choose Your Plan</h1>
        <p className="subtitle text-center">
          Upgrade to unlock more books, longer sessions, and advanced features.
        </p>
      </section>

      <SubscriptionsPricingCards />
    </main>
  );
};

export default SubscriptionsPage;
