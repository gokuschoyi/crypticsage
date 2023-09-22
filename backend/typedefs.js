/**
 * @typedef {Object} User
 * @property {string} displayName - The user's display name.
 * @property {string} email - The user's email address.
 * @property {string} password - The user's password.
 * @property {string} mobile_number - The user's mobile number.
 * @property {string} profile_image - The URL of the user's profile image.
 * @property {boolean} emailVerified - Indicates whether the user's email is verified.
 * @property {string} date - The user's registration date in the format 'MM/DD/YYYY, HH:mm:ss AM/PM'.
 * @property {string} uid - The user's unique identifier.
 * @property {Object} preferences - User preferences object.
 * @property {boolean} preferences.theme - User's theme preference.
 * @property {boolean} preferences.dashboardHover - User's dashboard hover preference.
 * @property {boolean} preferences.collapsedSidebar - User's collapsed sidebar preference.
 * @property {string} signup_type - The type of signup method (e.g., 'facebook').
 * @property {Object} lesson_status - User's lesson status data.
 * @property {Object} quiz_status - User's quiz status data.
 */

/**
 * @typedef {object} UserLoginPayload
 * @property {string} accessToken Access token of the user
 * @property {boolean} admin_status Admin status of the user
 * @property {string} email Email of the user
 * @property {string} displayName Name of the user
 * @property {boolean} emailVerified Email verification status of the user
 * @property {string} uid Unique ID of the user
 * @property {object} preferences User preferences
 * @property {string} mobile_number Mobile number of the user
 * @property {string} signup_type Signup type of the user
 * @property {object} lesson_status Lesson status of the user
 * @property {boolean} passwordEmptyFlag Password empty flag of the user
 * @property {string} profile_image Profile image of the user
 * 
 */

/**
 * @typedef {object} RecentLessonQuiz
 * @property {object} mostRecentLesson Most recent lesson
 * @property {object} mostRecentQuiz Most recent quiz
 */

/**
 * @typedef {object} UserNamePasswordSignup
 * @property {string} signup_type Signup type of the user
 * @property {string} userName Username of the user
 * @property {string} password Password of the user
 * @property {string} email Email of the user
 * @property {string} mobile_number Mobile number of the user
 */

/**
 * @typedef {object} GoogleSignup
 * @property {string} signup_type Signup type of the user
 * @property {string} credential Google credential
 */

/**
 * @typedef {object} FacebookSignup
 * @property {string} signup_type Signup type of the user
 * @property {object} userInfo Facebook user info
 */

exports.definitions = {};