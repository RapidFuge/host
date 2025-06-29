const getBuildInfo = () => {
  // Check for Vercel
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return {
      type: 'Vercel',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl" aria-hidden="true"><path d="m12 1.608 12 20.784H0Z" /></svg>,
      color: 'text-white bg-gray-900 border border-neutral-800',
      context: process.env.NODE_ENV === "production" ? 'prod' : 'dev',
      details: [
        process.env.VERCEL_REGION && `Region: ${process.env.VERCEL_REGION}`,
        process.env.VERCEL_GIT_COMMIT_SHA && `Commit: ${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`,
        process.env.VERCEL_DEPLOYMENT_ID && `Deploy: ${process.env.VERCEL_DEPLOYMENT_ID.slice(0, 8)}`,
      ].filter(Boolean)
    };
  }

  // Check for Netlify
  if (process.env.NETLIFY || process.env.NETLIFY_SITE_NAME) {
    return {
      type: 'Netlify',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl" aria-hidden="true"><path d="M6.49 19.04h-.23L5.13 17.9v-.23l1.73-1.71h1.2l.15.15v1.2L6.5 19.04ZM5.13 6.31V6.1l1.13-1.13h.23L8.2 6.68v1.2l-.15.15h-1.2L5.13 6.31Zm9.96 9.09h-1.65l-.14-.13v-3.83c0-.68-.27-1.2-1.1-1.23-.42 0-.9 0-1.43.02l-.07.08v4.96l-.14.14H8.9l-.13-.14V8.73l.13-.14h3.7a2.6 2.6 0 0 1 2.61 2.6v4.08l-.13.14Zm-8.37-2.44H.14L0 12.82v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14Zm17.14 0h-6.58l-.14-.14v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14ZM11.05 6.55V1.64l.14-.14h1.65l.14.14v4.9l-.14.14h-1.65l-.14-.13Zm0 15.81v-4.9l.14-.14h1.65l.14.13v4.91l-.14.14h-1.65l-.14-.14Z" /></svg>,
      color: 'text-emerald-900 bg-teal-500 border border-teal-400',
      context: process.env.NODE_ENV === "production" ? 'prod' : 'dev',
      details: [
        process.env.DEPLOY_ID && `Deploy: ${process.env.DEPLOY_ID.slice(0, 8)}`,
        process.env.COMMIT_REF && `Commit: ${process.env.COMMIT_REF.slice(0, 7)}`,
        process.env.NETLIFY_SITE_NAME && `Site: ${process.env.NETLIFY_SITE_NAME}`,
        process.env.BRANCH && `Branch: ${process.env.BRANCH}`,
      ].filter(Boolean)
    };
  }

  // Check for GitHub Actions
  if (process.env.GITHUB_ACTIONS) {
    return {
      type: 'Docker/Github',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl" aria-hidden="true"><path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" /></svg>,
      color: 'text-gray-100 bg-gray-800 border border-gray-600',
      context: process.env.NODE_ENV === "production" ? 'prod' : 'dev',
      details: [
        process.env.GITHUB_RUN_NUMBER && `Run: #${process.env.GITHUB_RUN_NUMBER}`,
        process.env.GITHUB_SHA && `Commit: ${process.env.GITHUB_SHA.slice(0, 7)}`,
        process.env.GITHUB_WORKFLOW && `Workflow: ${process.env.GITHUB_WORKFLOW}`,
      ].filter(Boolean)
    };
  }

  // Check for other CI/Docker environments
  if (process.env.CI || process.env.DOCKER || process.env.CONTAINER) {
    return {
      type: 'Docker/CI',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl" aria-hidden="true"><path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" /></svg>,
      color: 'text-gray-100 bg-gray-700 border border-gray-500',
      context: process.env.NODE_ENV === "production" ? 'prod' : 'dev',
      details: [
        process.env.CI && 'CI Build',
        (process.env.DOCKER || process.env.CONTAINER) && 'Docker',
      ].filter(Boolean)
    };
  }

  return {
    type: 'Local Dev',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-2xl" aria-hidden="true"><path d="m4.49 11.97 6.682-6.681a.638.638 0 0 0 .204-.476V.838a.7.7 0 0 0-.42-.624.68.68 0 0 0-.736.148L1.4 9.193c-.94.94-1.388 1.85-1.4 2.805s.434 1.85 1.36 2.774l8.858 8.86a.638.638 0 0 0 .476.203.39.39 0 0 0 .26-.082.68.68 0 0 0 .42-.626v-4a.692.692 0 0 0-.204-.476L4.489 11.97h.002zm-2.64 1.32c-.34-.45-.502-.872-.502-1.28.012-.57.34-1.182 1.007-1.85l7.66-7.662v2.057l-7.06 7.06A4.355 4.355 0 0 0 1.85 13.29zm8.166 8.205-6.451-6.45a.748.748 0 0 0-.094-.12c-.204-.207-.816-.819.094-1.961l6.45 6.449v2.082zM13.782.376a.668.668 0 0 0-.734-.15.68.68 0 0 0-.422.626v4.015c.004.18.076.35.204.476l6.681 6.68-6.681 6.682a.638.638 0 0 0-.204.476v3.96a.682.682 0 0 0 1.156.49l8.817-8.817c.94-.94 1.389-1.85 1.4-2.804.017-.952-.433-1.85-1.36-2.775L13.782.376zm.204 4.205V2.5l6.451 6.448c.026.044.06.084.094.122.204.204.816.817-.094 1.96l-6.449-6.45-.002.002zm7.647 9.267-7.66 7.661v-2.04l7.06-7.077a4.451 4.451 0 0 0 1.104-1.674c.34.45.504.872.504 1.28-.014.57-.34 1.17-1.008 1.85zm-4.626-1.294H6.9a.516.516 0 0 1-.516-.516v-.054c0-.286.23-.518.516-.518h10.11a.52.52 0 0 1 .518.518v.054a.526.526 0 0 1-.518.516h-.004zm-1.44-2.544v.056a.516.516 0 0 1-.52.516H8.842a.516.516 0 0 1-.518-.516v-.056c0-.285.232-.517.518-.517h6.205c.286 0 .516.232.516.517h.002zm-1.92-1.987v.054a.516.516 0 0 1-.517.518h-2.464a.516.516 0 0 1-.516-.518v-.054c0-.286.232-.516.516-.516h2.464a.508.508 0 0 1 .516.516zm-.517 7.443c.284 0 .516.232.516.518v.054a.516.516 0 0 1-.516.516h-2.464a.516.516 0 0 1-.516-.516v-.054c0-.286.232-.518.516-.518h2.464zm1.918-.912H8.843a.516.516 0 0 1-.518-.516v-.054a.52.52 0 0 1 .518-.518h6.205c.286 0 .516.232.516.518v.054a.516.516 0 0 1-.516.516z" /></svg>,
    color: 'text-neutral-100 bg-neutral-900 border border-neutral-400',
    context: process.env.NODE_ENV === "production" ? 'prod' : 'dev',
    details: [
      `Port: ${process.env.PORT || '3000'}`,
      'Development Server'
    ]
  };
};

export default function Footer() {
  const buildInfo = getBuildInfo();
  const version = process.env.APP_VERSION || '0.0.0';

  return (
    <footer className="pb-4 text-gray-200 mb-1">
      <div className="max-w-5xl xl:max-w-5xl mx-auto divide-y divide-gray-900 px-4 sm:px-6 md:px-8">
        <div className="pt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${buildInfo.color}`}>
              <span className="text-sm">{buildInfo.icon}</span>
              <span>{buildInfo.type}</span>
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-medium">Rapid Host</span>
              <span className="mx-1">•</span>
              <span className="font-medium">v{version}</span>
              <span className="mx-1">•</span>
              <span className="font-medium">{buildInfo.context}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-x-2 text-xs text-gray-500">
            {/* Build details first */}
            {buildInfo.details.map((detail, index) => (
              <span key={index} className="whitespace-nowrap">
                {detail}
                {index < buildInfo.details.length - 1 && <span className="mx-1.5">•</span>}
              </span>
            ))}

            {buildInfo.details.length > 0 && <span className="mx-1.5">•</span>}

            <details className="relative">
              <summary className="cursor-pointer hover:text-gray-300 select-none">
                Debug Info
              </summary>
              <pre className="absolute bottom-full right-0 mb-2 p-3 w-max max-w-lg rounded-md bg-gray-900 shadow-lg font-mono text-xs text-left z-10 overflow-x-auto">
                <code>
                  {`
NODE_ENV:             ${process.env.NODE_ENV || 'N/A'}
VERCEL:               ${process.env.VERCEL || 'N/A'}
VERCEL_ENV:           ${process.env.VERCEL_ENV || 'N/A'}
VERCEL_DEPLOYMENT_ID: ${process.env.VERCEL_DEPLOYMENT_ID || 'N/A'}
NETLIFY:              ${process.env.NETLIFY || 'N/A'}
NETLIFY_SITE_NAME:    ${process.env.NETLIFY_SITE_NAME || 'N/A'}
DEPLOY_ID:            ${process.env.DEPLOY_ID || 'N/A'}
GITHUB_ACTIONS:       ${process.env.GITHUB_ACTIONS || 'N/A'}
CI:                   ${process.env.CI || 'N/A'}
                `.trim()}
                </code>
              </pre>
            </details>
          </div>
        </div>
      </div>
    </footer>
  );
}