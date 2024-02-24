import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub, faDev, faInstagram, faCodepen } from '@fortawesome/free-brands-svg-icons'
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
    <main className="flex flex-col min-h-screen p-24">
      <section className="relative flex flex-col">
        <div className="mb-10">
          <Image alt="" width="512" height="512" decoding="async" data-nimg="1" className="rounded-full bg-zinc-100 object-cover dark:bg-zinc-800 h-16 w-16" sizes="4rem" src="/portfolio.heic"  />
        </div>
        <h1 className={`text-3xl font-bold tracking-tight text-zinc-600 sm:text-3xl dark:text-zinc-400 mb-8`}>
          Hi, I{"'"}m Ajmal
        </h1>
        <h1 className={`text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 mb-8`}>
          A Software engineer, traveller, and photographer.
        </h1>
        <h1 className={`text-3xl font-bold tracking-tight text-zinc-600 sm:text-3xl dark:text-zinc-400`}>
          I craft compelling front-end experiences, pixel by pixel.
        </h1>
      </section>
      <section className="flex gap-8 mt-16">
        <a href="https://www.linkedin.com/in/ajmalhassankn/" target="_blank"><FontAwesomeIcon icon={faLinkedin} className="w-6" /></a>
        <a href="https://github.com/ajmalhassan" target="_blank"><FontAwesomeIcon icon={faGithub} className="w-6" /></a>
        <a href="https://dev.to/ajmalhassan" target="_blank"><FontAwesomeIcon icon={faDev} className="w-6" /></a>
        <a href="https://codepen.io/ajmalhassankn" target="_blank"><FontAwesomeIcon icon={faCodepen} className="w-6" /></a>
        <a href="https://www.instagram.com/_ajmalhassan" target="_blank"><FontAwesomeIcon icon={faInstagram} className="w-6" /></a>
      </section>
      <section>
        <h1 id="experience" className={`text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100 my-16`}>
          Experience
        </h1>
        <ol className="relative border-s border-gray-200 dark:border-gray-700">
          {
            experiences.map(experience => (
              <li className="mb-10 ms-4" key={experience.id}>
                <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{experience.started} {experience.isCurrentlyWorkingHere && "· Current"}</time>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{experience.companyName}</h3>
                <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">{experience.designation}</p>
                <a href={experience.website} className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:outline-none focus:ring-gray-100 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700">
                  Visit 
                  <svg className="w-3 h-3 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                  </svg>
                </a>
              </li>
              ))
          }
        </ol>
      </section>
    </main>
  );
}
