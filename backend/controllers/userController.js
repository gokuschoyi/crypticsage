const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const Validator = require('../utils/validator');
const userServices = require('../services/userServices')
const getWordOfTheDay = require('../data/wodData')

const verifyPassword = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateVerifyPasswordInput({ params });
		if (isInputValid) {
			const email = res.locals.data.email
			const password = params.password
			const [message, validPassword] = await userServices.processVerifyPassword({ email, password });
			log.info({ message, validPassword })
			res.status(200).json({ message: message, validPassword })
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message, validPassword: false });
	}
}

const updatePassword = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateNewPasswordInput({ params })
		if (isInputValid) {
			const email = res.locals.data.email
			const newPassword = params.password
			await userServices.processUpdatePassword({ email, newPassword })
			res.status(200).json({ message: "Password updated successfully", status: true });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const updateProfilePicture = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateProfilePictureInput({ params })
		if (isInputValid) {
			const email = res.locals.data.email
			const profilePicture = params.profileImage
			const [message, uStatus] = await userServices.processUpdateProfilePicture({ email, profilePicture })
			res.status(200).json({ message: message, status: uStatus });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const updateUserData = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateUserDataInput({ params })
		if (isInputValid) {
			const email = res.locals.data.email
			const userData = params.userData
			const [message, uStatus] = await userServices.processUpdateUserData({ email, userData })
			res.status(200).json({ message: message, status: uStatus });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const updateUserPreference = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateUserPreferenceInput({ params })
		if (isInputValid) {
			const email = res.locals.data.email
			const preferences = params.preferences
			const [message, uStatus] = await userServices.processUpdateUserPreferences({ email, preferences })
			res.status(200).json({ message: message, status: uStatus });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const updateUserLessonStatus = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateUserLessonStatusInput({ params })
		if (isInputValid) {
			const email = res.locals.data.email
			const lesson_status = params.lesson_status
			const [message, uStatus, userLessonStatus] = await userServices.processUpdateUserLessonStatus({ email, lesson_status })
			res.status(200).json({ message: message, status: uStatus, lessonStatus: userLessonStatus });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const getInitialQuizDataForUser = async (req, res) => {
	try {
		const email = res.locals.data.email
		const quizData = await userServices.processGetInitialQuizDataForUser({ email })
		res.status(200).json({ message: "Quiz data fetched successfully", transformedQuizData: quizData });
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const getQuiz = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateGetQuizInput({ params })
		if (isInputValid) {
			const quizId = params.quizId
			let selectedQuiz = await userServices.processGetQuiz({ quizId })
			res.status(200).json({ message: "Quiz fetched successfully", selectedQuiz });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const submitQuiz = async (req, res) => {
	try {
		const params = req.body;
		const isInputValid = Validator.validateSubmitQuizInput({ params })
		if (isInputValid) {
			const email = res.locals.data.email
			const { sectionId, lessonId, quizId, quizData } = params
			const data = await userServices.processSubmitQuiz({ email, sectionId, lessonId, quizId, quizData })
			res.status(200).json({ message: "Quiz submitted successfully", status: true, data });
		}
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const getRecentLessonAndQuizStatus = async (req, res) => {
	try {
		const email = res.locals.data.email
		let recentLessonQuizStatus = await userServices.processGetRecentLessonAndQuiz({ email })
		res.status(200).json({ message: "Recent lesson and quiz status fetched successfully", recentLessonQuizStatus });
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const fileUpload = async (req, res) => {
	try {
		let finalResult = await userServices.processFileUpload(req)
		res.status(200).json({ message: "File uploaded successfully", finalResult });
	} catch (error) {
		log.error(error.stack)
		res.status(400).json({ message: error.message });
	}
}

const wordOfTheDay = async (req, res) => {
	let wordData = getWordOfTheDay()
	res.status(200).json({ message: "Word of the day request success", word: wordData });
}

module.exports = {
	verifyPassword,
	updatePassword,
	updateProfilePicture,
	updateUserData,
	updateUserPreference,
	updateUserLessonStatus,
	getInitialQuizDataForUser,
	getQuiz,
	submitQuiz,
	getRecentLessonAndQuizStatus,
	fileUpload,
	wordOfTheDay,
}