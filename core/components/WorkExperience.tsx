import Experience from "@/common/types/Experience";

interface Props {
  experiences: Experience[];
}

const WorkExperience = ({ experiences }: Props) => {
  return (
    <ol className="relative border-s border-gray-200 dark:border-gray-700">
      {experiences.map((experience) => (
        <li className="mb-10 ms-4" key={experience.id}>
          <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
          <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
            {experience.started}{" "}
            {experience.isCurrentlyWorkingHere && "· Current"}
          </time>
          <a
            href={experience.website}
            target="_blank"
            className="hover:underline"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {experience.companyName}
            </h3>
          </a>
          <p className="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
            {experience.designation}
          </p>
        </li>
      ))}
    </ol>
  );
};

export default WorkExperience;
