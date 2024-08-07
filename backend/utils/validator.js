const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))

const validateLoginInput = ({ login_type, params }) => {
    try {
        if (login_type === undefined || login_type === '') {
            throw new Error('Login type cannot be empty')
        } else if (login_type === 'emailpassword') {
            const { email, password } = params
            if (email === undefined || email === '' || password === undefined || password === '') {
                throw new Error('Email or Password cannot be empty')
            }
        } else if (login_type === 'google') {
            const { credential } = params
            if (credential === undefined || credential === '') {
                throw new Error('Google credential cannot be empty')
            }
        } else if (login_type === 'facebook') {
            const { facebook_email } = params
            if (facebook_email === undefined || facebook_email === '') {
                throw new Error('Facebook email cannot be empty')
            }
        } else {
            throw new Error('Invalid login type')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateSignupInput = ({ signup_type, params }) => {
    try {
        if (signup_type === undefined || signup_type === '') {
            throw new Error('Signup type cannot be empty')
        } else if (signup_type === 'registration') {
            const { userName, email, password, mobile_number } = params
            if (userName === undefined || userName === '' || email === undefined || email === '' || password === undefined || password === '' || mobile_number === undefined || mobile_number === '') {
                throw new Error('(VALIDATOR-Signup):User name, email, password or mobile number cannot be empty')
            }
        } else if (signup_type === 'google') {
            const { credentials } = params
            if (credentials === undefined || credentials === '') {
                throw new Error('(VALIDATOR-Signup):Invalid Google credentials, please try again')
            }
        } else if (signup_type === 'facebook') {
            const { userInfo } = params
            if (userInfo === undefined || userInfo === '') {
                throw new Error('(VALIDATOR-Signup):Invalid Facebook credentials, please try again')
            }
        } else {
            throw new Error('(VALIDATOR-Signup):Invalid signup type')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateVerifyPasswordInput = ({ params }) => {
    try {
        const { password } = params
        if (password === undefined || password === '') {
            throw new Error('(VALIDATOR-VerifyPassword):Password cannot be empty')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateNewPasswordInput = ({ params }) => {
    try {
        const { password } = params
        if (password === undefined || password === '') {
            throw new Error('(VALIDATOR-NewPassword):Password cannot be empty')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateProfilePictureInput = ({ params }) => {
    try {
        const { profileImage } = params
        if (profileImage === undefined || profileImage === '') {
            throw new Error('(VALIDATOR-ProfilePicture):Profile picture cannot be empty')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateUserDataInput = ({ params }) => {
    try {
        const { userData } = params
        if (userData.displayName === undefined || userData.displayName === '' || userData.mobile_number === undefined || userData.mobile_number === '') {
            throw new Error('(VALIDATOR-UserData):User data cannot be empty')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateUserPreferenceInput = ({ params }) => {
    try {
        const { preferences } = params
        if (preferences.dashboardHover === undefined || preferences.dashboardHover === '' || preferences.collapsedSidebar === undefined || preferences.collapsedSidebar === '') {
            throw new Error('(VALIDATOR-UserPreference):User preference cannot be empty')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateUserLessonStatusInput = ({ params }) => {
    try {
        const { lesson_status } = params
        if (lesson_status === undefined || lesson_status === '') {
            throw new Error('(VALIDATOR-UserLessonStatus):User lesson status cannot be empty')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateGetQuizInput = ({ params }) => {
    try {
        const { quizId } = params
        if (quizId === undefined || quizId === '') {
            throw new Error('(VALIDATOR-GetQuiz):Quiz Id is required')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateSubmitQuizInput = ({ params }) => {
    try {
        const { sectionId, lessonId, quizId, quizData } = params
        if (sectionId === undefined || sectionId === '' || lessonId === undefined || lessonId === '' || quizId === undefined || quizId === '' || quizData === undefined || quizData === '') {
            throw new Error('(VALIDATOR-SubmitQuiz):Section Id, Lesson Id, Quiz Id or Quiz Data is missing')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateAddSectionInputs = ({ params }) => {
    try {
        const { title, content } = params
        if (title === undefined || title === '' || content === undefined || content === '') {
            throw new Error('(VALIDATOR-AddSection) Invalid section data. (Parameters missing, title or content)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateUpdateSectionInputs = ({ params }) => {
    try {
        const { sectionId } = params
        if (sectionId === undefined || sectionId === '') {
            throw new Error('(VALIDATOR-UpdateSection) Invalid section or empty sectionId. (Parameters missing, sectionId)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateAddLessonInputs = ({ params }) => {
    try {
        const { chapter_title, sectionId, lessonData } = params
        if (chapter_title === undefined || chapter_title === '' || sectionId === undefined || sectionId === '' || lessonData === undefined || lessonData === '') {
            throw new Error('(VALIDATOR-AddLesson) Invalid lesson data. (Parameters missing, chapter_title, sectionId or lessonData)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateDeleteLessonInputs = ({ params }) => {
    try {
        const { lessonId } = params
        if (lessonId === undefined || lessonId === '') {
            throw new Error('(VALIDATOR-DeleteLesson) Invalid lesson data. (Parameters missing, lessonId)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateAddQuizInputs = ({ params }) => {
    try {
        const { quizData } = params
        const { sectionId, lessonId } = quizData
        if (sectionId === undefined || sectionId === '' || lessonId === undefined || lessonId === '') {
            throw new Error('(VALIDATOR-AddQuiz) Invalid quiz data. (Parameters missing, sectionId or lessonId)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateUpdateQuizDataInputs = ({ params }) => {
    try {
        const { quizId, quizTitle, quizDescription, questions } = params
        if (quizId === undefined || quizId === '' || quizTitle === undefined || quizTitle === '' || quizDescription === undefined || quizDescription === '' || questions === undefined || questions === '') {
            throw new Error('(VALIDATOR-UpdateQuizData) Invalid quiz data. (Parameters missing, quizId, quizTitle, quizDescription or questions)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateDeleteQuizInputs = ({ params }) => {
    try {
        const { sectionId, lessonId, quizId } = params
        if (sectionId === undefined || sectionId === '' || lessonId === undefined || lessonId === '' || quizId === undefined || quizId === '') {
            throw new Error('(VALIDATOR-DeleteQuiz) Invalid quiz data. (Parameters missing, sectionId, lessonId or quizId)')
        }
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const validateFetchTickerDataInput = ({ params }) => {
    try {
        let { asset_type, ticker_name, period, page_no, items_per_page } = params
        // Check if any parameter is null or empty
        if (!asset_type || !ticker_name || !period || !page_no) {
            throw new Error("Invalid input. Check parameters and try again.");
        }

        // Check for valid asset_type
        if (asset_type !== "crypto" && asset_type !== "stock") {
            throw new Error("Invalid asset type. Possible values: crypto, stock");
        }

        // Check for valid period based on asset_type
        const cryptoPeriods = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"];
        const stocksPeriods = ["1d", "1wk", "1mo"];

        if (asset_type === "crypto" && !cryptoPeriods.includes(period)) {
            throw new Error("Invalid period for crypto asset type.");
        }

        if (asset_type === "stocks" && !stocksPeriods.includes(period)) {
            throw new Error("Invalid period for stocks asset type.");
        }

        // Check for valid page_no (positive number)
        if (isNaN(page_no) || page_no <= 0) {
            throw new Error("Invalid page no. Page no must be a positive number.");
        }

        let default_pg_length = 80
        if (isNaN(items_per_page) || items_per_page < 80) {
            items_per_page = default_pg_length
        }

        let payload = {
            asset_type,
            ticker_name,
            period,
            page_no,
            items_per_page
        }

        // All parameters are valid, return true or perform further processing
        return [true, payload];
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


module.exports = {
    validateLoginInput
    , validateSignupInput
    , validateVerifyPasswordInput
    , validateNewPasswordInput
    , validateProfilePictureInput
    , validateUserDataInput
    , validateUserPreferenceInput
    , validateUserLessonStatusInput
    , validateGetQuizInput
    , validateSubmitQuizInput
    , validateAddSectionInputs
    , validateUpdateSectionInputs
    , validateAddLessonInputs
    , validateDeleteLessonInputs
    , validateAddQuizInputs
    , validateUpdateQuizDataInputs
    , validateDeleteQuizInputs
    , validateFetchTickerDataInput
    ,
}  