import Image from "next/image";
import Link from "next/link";
import { BookOpen, Camera, Heart, Palette, ShieldCheck, Smile, Sparkles } from "lucide-react";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import BlogBodyRenderer from "@/components/blog/BlogBodyRenderer";
import TeamMemberCard from "@/components/team/TeamMemberCard";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import type { SitePage } from "@/app/types/sitePage";
import type { TeamMember } from "@/app/types/teamMember";

const BUTTON_CLASS =
  "inline-block bg-gradient-to-b from-[#3F3C95] to-[#2B2882] text-white font-extrabold text-sm md:text-base uppercase tracking-wider px-8 py-3 rounded-full border-b-[4px] border-[#C8942A] shadow-[0_4px_10px_rgba(63,60,149,0.3)] transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-[2px]";

const VALUES = [
  {
    icon: Smile,
    title: "Made for your child",
    text: "Every book is built around one child: their name, their face and their own adventure.",
  },
  {
    icon: Palette,
    title: "Crafted with care",
    text: "Real illustrated stories, checked page by page, then printed as a keepsake that lasts.",
  },
  {
    icon: ShieldCheck,
    title: "Handled with care",
    text: "Every photo and every page is handled with care, from your first upload to the book at your door.",
  },
  {
    icon: Heart,
    title: "Made to be shared",
    text: "Bedtime reading, birthdays, grandparents far away: a story that brings people closer.",
  },
];

const STEPS = [
  { icon: Camera, title: "Upload a photo", text: "Share a clear photo of your child and pick a story they will love." },
  { icon: Sparkles, title: "Watch the story come alive", text: "We place your child into every page and show you the previews." },
  { icon: BookOpen, title: "Get your printed book", text: "Choose your favourites and we print and deliver it to your door." },
];

/**
 * The About Us page layout: hero, the admin's ABOUT text as the story, values, a short how it works, the
 * team and a closing call to action. It has no hooks of its own; the admin text is passed through the same
 * renderer as the legal pages, which sanitises it.
 */
export default function AboutView({ page, members }: { page: SitePage; members: TeamMember[] }) {
  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 pt-32 md:pt-36 pb-12 md:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className={`${hankenGrotesk.className} text-[#F26A2E] font-extrabold uppercase tracking-widest text-sm mb-3`}>
              About UniLake
            </p>
            <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] leading-[1.05] mb-5`}>
              Every child is the hero of their own story
            </h1>
            <p className={`${hankenGrotesk.className} text-[#555555] font-semibold text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8`}>
              We turn your child&apos;s name and face into a printed comic book they will want to read again and again.
            </p>
            <Link
              href="/comic"
              className={`${hankenGrotesk.className} ${BUTTON_CLASS}`}
            >
              Explore comics
            </Link>
          </div>
          <div className="flex justify-center">
            <Image
              src="/assets/home_page/kidWithRobo.png"
              alt="A boy repairing a giant friendly robot"
              width={460}
              height={380}
              priority
              className="w-full max-w-[320px] md:max-w-[420px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Story: the admin's ABOUT text */}
      <section className="bg-white/60 py-14 md:py-20">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-center">
          <div className="flex justify-center">
            <Image
              src="/assets/home_page/hardcover.png"
              alt="A hardcover personalised storybook titled My Special Story"
              width={632}
              height={560}
              className="w-full max-w-[300px] md:max-w-[400px] h-auto rounded-3xl shadow-xl"
            />
          </div>
          <div className="min-w-0">
            <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-4xl uppercase text-[#914A8C] mb-6`}>
              Our story
            </h2>
            <BlogBodyRenderer html={page.body} />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 py-14 md:py-20">
        <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-4xl uppercase text-[#914A8C] text-center mb-10`}>
          What we believe in
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E7EB]">
              <div className="w-12 h-12 rounded-full bg-[#914A8C] flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <h3 className={`${hankenGrotesk.className} text-[#1A1A1A] font-extrabold text-lg mb-2`}>{title}</h3>
              <p className={`${hankenGrotesk.className} text-[#555555] font-medium text-sm md:text-base leading-relaxed`}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works, in short */}
      <section className="bg-[#914A8C] py-14 md:py-20">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12">
          <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-4xl uppercase text-white text-center mb-10`}>
            How it works
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="flex flex-col items-center text-center">
                <div className="relative w-16 h-16 rounded-full bg-[#FFD54A] flex items-center justify-center mb-4">
                  <Icon className="w-8 h-8 text-[#914A8C]" aria-hidden="true" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-[#914A8C] text-xs font-extrabold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className={`${hankenGrotesk.className} text-white font-extrabold text-xl mb-2`}>{title}</h3>
                <p className={`${hankenGrotesk.className} text-white/90 font-medium text-sm md:text-base leading-relaxed max-w-xs`}>{text}</p>
              </li>
            ))}
          </ol>
          <div className="text-center">
            <Link
              href="/how_it_work"
              className={`${hankenGrotesk.className} inline-block text-white font-bold underline underline-offset-4 hover:text-[#FFD54A] transition-colors`}
            >
              See the full walkthrough
            </Link>
          </div>
        </div>
      </section>

      {/* Team */}
      {members.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 py-14 md:py-20">
          <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-4xl uppercase text-[#914A8C] text-center mb-12`}>
            The people behind the stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* Call to action */}
      <section className="max-w-4xl mx-auto w-full px-6 sm:px-8 lg:px-12 pt-14 md:pt-20 pb-20 text-center">
        <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-4xl uppercase text-[#37308D] mb-4`}>
          Ready to meet your hero?
        </h2>
        <p className={`${hankenGrotesk.className} text-[#555555] font-semibold text-base md:text-lg mb-8`}>
          Pick a story and make a book your child will keep for years.
        </p>
        <Link
          href="/comic"
          className={`${hankenGrotesk.className} ${BUTTON_CLASS}`}
        >
          Create their comic
        </Link>
      </section>

      <Footer />
    </main>
  );
}
