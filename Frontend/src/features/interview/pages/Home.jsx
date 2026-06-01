import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'

const Home = () => {

    const { loading, generateReport,reports } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ error, setError ] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const MAX_RESUME_SIZE = 3 * 1024 * 1024 // must match backend multer limit (3MB)

    const handleResumeChange = (e) => {
        setError("")
        const file = e.target.files[ 0 ]
        if (!file) {
            setResumeFile(null)
            return
        }
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            setError("Only PDF resumes are supported.")
            e.target.value = ""
            setResumeFile(null)
            return
        }
        if (file.size > MAX_RESUME_SIZE) {
            setError("Resume is too large. Max size is 3MB.")
            e.target.value = ""
            setResumeFile(null)
            return
        }
        setResumeFile(file)
    }

    const handleGenerateReport = async () => {
        setError("")
        if (!jobDescription.trim()) {
            setError("Job description is required.")
            return
        }
        if (!resumeFile && !selfDescription.trim()) {
            setError("Please upload a resume or write a self-description.")
            return
        }
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile })
            if (data?._id) {
                navigate(`/interview/${data._id}`)
            } else {
                setError("Could not generate the report. Please try again.")
            }
        } catch (err) {
            console.log(err)
            setError("Something went wrong while generating your plan.")
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>0 / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label className={`dropzone${resumeFile ? ' dropzone--filled' : ''}`} htmlFor='resume'>
                                <span className='dropzone__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                {resumeFile ? (
                                    <>
                                        <p className='dropzone__title'>✓ {resumeFile.name}</p>
                                        <p className='dropzone__subtitle'>{(resumeFile.size / 1024).toFixed(0)} KB · Click to change</p>
                                    </>
                                ) : (
                                    <>
                                        <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                        <p className='dropzone__subtitle'>PDF only (Max 3MB)</p>
                                    </>
                                )}
                                <input ref={resumeInputRef} onChange={handleResumeChange} hidden type='file' id='resume' name='resume' accept='.pdf' />
                            </label>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>

                        {error && (
                            <div className='info-box' style={{ borderColor: '#ff5470', color: '#ff5470' }}>
                                <p style={{ margin: 0 }}>{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <div className='page-footer__top'>
                    <div className='page-footer__credit'>
                        <span className='page-footer__label'>Architected &amp; Engineered by</span>
                        <span className='page-footer__name'>Souvik Biswas</span>
                    </div>
                    <div className='page-footer__links'>
                        <a href='https://souvikbiswas-portfolio.pages.dev' target='_blank' rel='noopener noreferrer' className='page-footer__link'>
                            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='10' /><line x1='2' y1='12' x2='22' y2='12' /><path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' /></svg>
                            Portfolio
                        </a>
                        <a href='https://github.com/souvik-biswas-dev/' target='_blank' rel='noopener noreferrer' className='page-footer__link'>
                            <svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='currentColor'><path d='M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.18.08 1.8 1.21 1.8 1.21 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.47.11-3.06 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.82 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.77.11 3.06.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.41-5.27 5.69.42.36.8 1.08.8 2.18v3.23c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z' /></svg>
                            GitHub
                        </a>
                    </div>
                </div>
                <div className='page-footer__divider' />
                <div className='page-footer__stack'>
                    <span className='page-footer__stack-label'>Built with</span>
                    {/* React */}
                    <span className='tech-logo' title='React 19'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='-11.5 -10.23174 23 20.46348'>
                            <circle cx='0' cy='0' r='2.05' fill='#61DAFB'/>
                            <g stroke='#61DAFB' strokeWidth='1' fill='none'>
                                <ellipse rx='11' ry='4.2'/>
                                <ellipse rx='11' ry='4.2' transform='rotate(60)'/>
                                <ellipse rx='11' ry='4.2' transform='rotate(120)'/>
                            </g>
                        </svg>
                    </span>
                    {/* Vite */}
                    <span className='tech-logo' title='Vite'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
                            <defs>
                                <linearGradient id='vite-g1' x1='6' y1='6.888' x2='23' y2='27.471' gradientUnits='userSpaceOnUse'>
                                    <stop offset='0' stopColor='#41d1ff'/>
                                    <stop offset='1' stopColor='#bd34fe'/>
                                </linearGradient>
                                <linearGradient id='vite-g2' x1='13.46' y1='1.352' x2='16.526' y2='21.4' gradientUnits='userSpaceOnUse'>
                                    <stop offset='0' stopColor='#ff3cac'/>
                                    <stop offset='.527' stopColor='#784ba0'/>
                                    <stop offset='1' stopColor='#2b86c5'/>
                                </linearGradient>
                            </defs>
                            <path fill='url(#vite-g1)' d='M29 5.387 16.635 27.676a.746.746 0 0 1-1.3.007L2.958 5.389a.747.747 0 0 1 .808-1.096l12.092 2.418a.748.748 0 0 0 .292 0l11.845-2.413A.746.746 0 0 1 29 5.387Z'/>
                            <path fill='url(#vite-g2)' d='M20.395 2.088 11.1 3.9a.364.364 0 0 0-.293.346l-.576 9.8a.364.364 0 0 0 .418.38l2.54-.483a.364.364 0 0 1 .427.442l-.754 3.654a.364.364 0 0 0 .44.43l1.568-.378a.364.364 0 0 1 .44.43l-1.2 5.8L16 26l1.4-6.7.5-2.45-1.81.346a.364.364 0 0 1-.424-.448l.76-3.3a.364.364 0 0 1 .414-.278l2.776.527a.364.364 0 0 0 .418-.385l-.407-6.527a.364.364 0 0 0-.34-.344l-1.033-.1.41-5.14a.363.363 0 0 1 .318-.312l1.013-.1Z'/>
                        </svg>
                    </span>
                    {/* Node.js */}
                    <span className='tech-logo' title='Node.js'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
                            <path fill='#83cd29' d='M16 30a2.151 2.151 0 0 1-1.076-.288L11.5 27.685c-.511-.286-.262-.387-.093-.446a6.828 6.828 0 0 0 1.549-.7.263.263 0 0 1 .255.019l2.631 1.563a.34.34 0 0 0 .318 0l10.26-5.922a.323.323 0 0 0 .159-.278V10.075a.327.327 0 0 0-.162-.281L16.158 3.875a.323.323 0 0 0-.317 0L5.587 9.794a.33.33 0 0 0-.162.281v11.84a.315.315 0 0 0 .161.274L8.4 23.814c1.525.762 2.459-.136 2.459-1.038V11.085a.3.3 0 0 1 .3-.3h1.3a.3.3 0 0 1 .3.3v11.692c0 2.035-1.108 3.2-3.038 3.2a4.389 4.389 0 0 1-2.363-.642l-2.689-1.547a2.166 2.166 0 0 1-1.076-1.872V10.075a2.162 2.162 0 0 1 1.076-1.872l10.261-5.924a2.246 2.246 0 0 1 2.156 0l10.26 5.924a2.165 2.165 0 0 1 1.077 1.872v11.84a2.171 2.171 0 0 1-1.077 1.872L17.076 29.712A2.152 2.152 0 0 1 16 30z'/>
                            <path fill='#83cd29' d='M20.685 21.96a4.851 4.851 0 0 1-2.756-.767 3.3 3.3 0 0 1-1.366-2.2.3.3 0 0 1 .3-.325h1.327a.3.3 0 0 1 .295.243 1.876 1.876 0 0 0 .9 1.214 3.43 3.43 0 0 0 1.8.384 3.643 3.643 0 0 0 1.8-.381.981.981 0 0 0 .508-.87c0-.374-.148-.651-1.476-1.01l-1.856-.541c-2.023-.546-3.054-1.715-3.054-3.388a3.265 3.265 0 0 1 1.409-2.7 5.228 5.228 0 0 1 3.019-.873 5.559 5.559 0 0 1 2.619.619 3.164 3.164 0 0 1 1.444 2.023.3.3 0 0 1-.3.344h-1.347a.3.3 0 0 1-.282-.2 1.786 1.786 0 0 0-.769-1.014 2.927 2.927 0 0 0-1.538-.342 3.066 3.066 0 0 0-1.637.38.989.989 0 0 0-.5.868c0 .373.315.632 1.618.974l1.356.387c2.416.644 3.518 1.755 3.518 3.485a3.358 3.358 0 0 1-1.449 2.734 5.773 5.773 0 0 1-3.332.877z'/>
                        </svg>
                    </span>
                    {/* Express */}
                    <span className='tech-logo tech-logo--express' title='Express'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
                            <path fill='currentColor' d='M126.67 98.44c-4.56 1.16-7.38.05-9.91-3.75-5.68-8.51-11.95-16.63-18-24.9-.78-1.07-1.59-2.12-2.6-3.45-5.99 8.07-11.95 15.79-17.73 23.64-2.64 3.64-5.42 5.26-10.13 4.32l22.56-30.28-21-28.5c4.5-.74 7.56-.13 10.26 3.75 5.77 8.28 12.16 16.12 18.73 24.67 6.46-8.73 12.78-17.16 19.1-25.6 2.61-3.51 5.41-5.03 9.91-4.04l-11.83 15.8-9.6 12.85c7.63 10.27 15.18 20.43 22.72 30.59z'/>
                            <path fill='currentColor' d='M1.33 61.74c.72-3.41 1.22-6.88 2.2-10.22 5.41-18.5 26.92-26.87 43.04-16.77 9.93 6.25 12.75 16.11 12.6 27.79H8.37c-.15 10.5 5.28 18.5 14.88 21.72 6.27 2.12 12.39 1.7 18.05-2.41 1.92-1.38 3.58-3.1 5.37-4.68l5.78 4.06c-9.3 13.59-32.05 14.93-44.59 2.7-6.59-6.44-9.31-14.36-9.38-24.2l-.03-2.78c0-.07.07-.12-.12-.22zm27.82-22.96c-7.5 1.49-13.42 8.05-13.65 14.57h26.2c-.48-7.15-4.92-12.85-12.55-14.57z'/>
                        </svg>
                    </span>
                    {/* MongoDB */}
                    <span className='tech-logo' title='MongoDB'>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>
                            <path fill='#589636' d='M15.9.087l.854 1.604c.192.296.4.558.645.802C19.473 4.714 21.5 8.185 22.049 12c.46 3.108.1 6.09-1.128 8.96-.806 1.894-1.928 3.595-3.625 4.812-.252.18-.49.38-.74.555-.075.052-.16.09-.265.15l-.271-1.614c-.2-1.638-.8-3.13-1.618-4.535l-1.028-1.682c-1.351-2.009-2.706-4.018-3.3-6.396C9.264 9.976 10.15 7.2 12.1 4.75c.73-.917 1.57-1.709 2.628-2.268.19-.1.38-.2.583-.308z'/>
                            <path fill='#6cac48' d='M15.9.087c-.202.207-.404.415-.61.617-2.357 2.5-3.695 5.48-3.795 8.937-.07 2.36.536 4.54 1.72 6.56.398.666.807 1.33 1.175 2.013.802 1.5 1.348 3.082 1.423 4.79.01.234.038.467.072.7.147.982.15 1.965.03 2.943l-.014.368c-.343.16-.49-.084-.624-.3C12.37 22.956 10.556 20.1 9.2 17c-1.187-2.75-1.65-5.602-1.2-8.577C8.58 5.018 10.697 2.2 13.9.5c.6-.325 1.26-.5 1.9-.087l.1-.326z'/>
                            <path fill='#c2bfbf' d='M15.9 29.913c-.125-.432-.26-.86-.37-1.3-.21-.82-.14-1.64.06-2.46.05-.2.1-.2.27-.1.43.32.69.76.94 1.22.33.61.45 1.27.42 1.96-.01.14-.04.27-.06.41l-.04.27h-1.22z'/>
                        </svg>
                    </span>
                </div>
            </footer>
        </div>
    )
}

export default Home