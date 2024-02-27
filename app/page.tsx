import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub, faDev, faInstagram, faCodepen } from '@fortawesome/free-brands-svg-icons'
import {} from "@fortawesome/react-fontawesome"
import Image from 'next/image'

const experiences = [
  {
    id: 4,
    started: "August 2023",
    isCurrentlyWorkingHere: true,
    designation: "Fullstack developer",
    companyName: "Quillbot",
    website: "https://quillbot.com"
  },
  {
    id: 3,
    started: "October 2021",
    isCurrentlyWorkingHere: false,
    designation: "Software Engineer III",
    companyName: "Plum",
    website: "https://plumhq.com"
  },
  {
    id: 2,
    started: "September 2018",
    isCurrentlyWorkingHere: false,
    designation: "Senior Product Engineer - Frontend",
    companyName: "Entri.app",
    website: "https://entri.app"
  },
  {
    id: 1,
    started: "August 2017",
    isCurrentlyWorkingHere: false,
    designation: "Frontend Developer",
    companyName: "Instio",
    website: "https://instio.co/"
  }
]

export default function Home() {
  return (
    <div className="flex w-full justify-center sm:px-8">
        <div className="flex flex-col w-full max-w-7xl mx-auto lg:px-8 bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20">
          <nav>
            
          </nav>
          <main className="flex flex-col min-h-screen p-8 sm:p-24">
            <section className="relative flex flex-col">
              <div className="mb-10">
                <Image alt="" width="512" height="512" decoding="async" data-nimg="1" className="rounded-full bg-zinc-100 object-cover dark:bg-zinc-800 h-16 w-16" sizes="4rem" src="/portrait.jpg"  />
              </div>
              <h1 className={`text-3xl font-bold tracking-tight text-zinc-600 sm:text-3xl dark:text-zinc-400 mb-8`}>
                Hi, I{"'"}m Ajmal
              </h1>
              <h1 className={`text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 mb-8`}>
                A software engineer, traveler, and hobby photographer.
              </h1>
              <h1 className={`text-3xl font-bold tracking-tight text-zinc-600 sm:text-3xl dark:text-zinc-400`}>
                I craft compelling front-end experiences, pixel by pixel.
              </h1>
            </section>
            <section className="flex gap-8 mt-12 text-zinc-600 dark:text-zinc-400">
              <a href="https://www.linkedin.com/in/ajmalhassankn/" target="_blank"><FontAwesomeIcon icon={faLinkedin} className="w-6" /></a>
              <a href="https://github.com/ajmalhassan" target="_blank"><FontAwesomeIcon icon={faGithub} className="w-6" /></a>
              <a href="https://dev.to/ajmalhassan" target="_blank"><FontAwesomeIcon icon={faDev} className="w-6" /></a>
              <a href="https://codepen.io/ajmalhassankn" target="_blank"><FontAwesomeIcon icon={faCodepen} className="w-6" /></a>
              <a href="https://www.instagram.com/_ajmalhassan" target="_blank"><FontAwesomeIcon icon={faInstagram} className="w-6" /></a>
            </section>
            <section>
              <h1 id="work" className={`text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 mt-16 mb-8`}>
                Work
              </h1>
              <ol className="relative border-s border-gray-200 dark:border-gray-700">
                {
                  experiences.map(experience => (
                    <li className="mb-10 ms-4" key={experience.id}>
                      <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                      <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{experience.started} {experience.isCurrentlyWorkingHere && "· Current"}</time>
                      <a href={experience.website} target="_blank" className="hover:underline"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">{experience.companyName}</h3></a>
                      <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">{experience.designation}</p>
                    </li>
                    ))
                }
              </ol>
            </section>
            <section>
              <h1 id="experience" className={`text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 mt-16 mb-8`}>
                Blog
              </h1>
              <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Lorem ipsum dolor sit amet
                  </h3>
                <time className="text-sm font-normal leading-none text-gray-400 dark:text-gray-500">February 27, 2024</time>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400 mt-2">
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <a href={"#"} target="_blank" className="hover:underline">
                <div className="relative mt-4 flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Read article ›
                </div>
                </a>
              </div>
            </section>
          </main>
          <footer className="flex justify-center border-t border-zinc-600 dark:border-zinc-600 py-8">
            <div className="text-zinc-600 dark:text-zinc-400 text-sm">
              © {new Date().getFullYear()} Ajmal Hassan. All rights reserved.
            </div>
          </footer>
        </div>
    </div>
  );
}
