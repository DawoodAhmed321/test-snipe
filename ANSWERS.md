# React Native Interview Answers

## 1. FlatList vs SectionList vs FlashList

I usually use FlatList for most scrollable lists like feeds, products, or chat messages because it already handles virtualization well and performs nicely for medium to large datasets.We can achive more enhancements by providing props to the Flatlist like initialNumToRender={10}, getItemLayout, removeClippedSubviews, windowSize={5}, maxToRenderPerBatch={10}
If the data needs grouping with headers, like contacts grouped alphabetically or transactions grouped by date, then I use SectionList because it keeps the structure cleaner.
For very large lists or performance-heavy screens, especially on lower-end Android devices, I prefer FlashList because it handles recycling more efficiently and gives smoother scrolling.

---

## 2. Animated API vs Reanimated

For most modern React Native apps, I prefer Reanimated because animations run on the UI thread, so they stay smooth even if the JS thread is busy.I mainly use the core Animated API for simple animations like opacity or scale changes where adding Reanimated may be unnecessary.For gesture-based animations like drag, swipe, or pinch, Reanimated is much better because it handles them smoothly at 60 FPS.

---

## 3. Hermes

I usually keep Hermes enabled because it improves startup time and overall performance, especially on Android devices.I’d only consider disabling it if a third-party SDK has compatibility issues with Hermes. In that case, I’d first measure the impact before making the change because Hermes gives noticeable performance benefits.

---

## 4. iOS Archive Build Fails on CI

The first thing I check is code signing and provisioning profiles because CI environments don’t have access to local machine certificates.
Then I verify that the Node, CocoaPods, and Xcode versions match the local setup because small version mismatches can break archive builds.
Finally, I check environment variables and release scheme configurations because sometimes values exist locally but are missing on CI.

---

## 5. Diagnosing an Intermittent Launch Crash

I usually start with Crashlytics or Sentry to identify crash patterns and stack traces.
Then I try reproducing the issue under low-memory conditions by backgrounding and reopening the app multiple times. In many cases, launch crashes come from async initialization issues like session restore or remote config not completing properly before the app renders.

---

## 6. A Real Bug That Took More Than a Day

I once worked on an Android issue where some users lost their navigation state after reopening the app from the background. The problem mainly happened on devices with aggressive memory management. The app was getting killed in the background, and the persisted navigation state wasn’t restoring correctly. We fixed it by delaying the restore slightly after the app became active again and adding fallback handling if the stored state was empty.

---

## 7. Supabase RLS Mistake

I inherited a project where an UPDATE policy was temporarily changed to allow all authenticated users to update any profile.The issue happened because the quick fix used a very broad policy instead of validating ownership properly. We fixed it by ensuring both USING and WITH CHECK conditions verified that auth.uid() matched the profile owner.

---

## 8. Edge Functions vs Direct Client Inserts

I use edge functions whenever the server needs to handle validation, business logic, external APIs, or secure operations.
For example:

- payment handling
- invite redemption
- derived fields
- multi-table operations

For simple owned-data writes like profile updates or personal notes, direct inserts with proper RLS policies are usually enough.

---

## 9. Schema Evolution

If favorites needed to support multiple favorite lists, I wouldn’t modify everything at once.
I’d create new tables for favorite lists and migrate existing favorites into a default list for each user. After verifying the migration is stable in production, I’d clean up old tables in a later release instead of deleting them immediately.

---

## 10. Redux to Zustand Migration

I wouldn’t rewrite the entire app at once. I’d migrate gradually. Because new features use hooks and Zustand and older Redux parts are migrated only when touched for fixes or new work this keeps development moving without creating a risky large-scale rewrite.We can use old logics but with optimized approach and synatctic change.My goal this week would be to understand the existing architecture first and start introducing the new patterns gradually without blocking feature work.I’d avoid touching critical business flows immediately.
Instead, I’d pick a small low-risk area, like UI state or a simple feature module, and migrate that to Zustand using hooks.Starting from small so at the end if any large or complex feature is going to be changed all of its dependent small stores are already covered with Zustand

---
