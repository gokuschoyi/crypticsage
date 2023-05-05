import React, { useState } from 'react'
import Login from '../../components/authorization/login/Login'
import Signup from '../../components/authorization/signup/Signup'
const Auth = () => {
    const [isLogin, setIsLogin] = useState(true)
    const switchState = () => {
        setIsLogin(!isLogin)
    }

    const [signupSuccessMessage, setSignupSuccessMessage] = useState('')
    return (
        isLogin
            ?
            <Login switchState={switchState} signupSuccessMessage={signupSuccessMessage} setSignupSuccessMessage={setSignupSuccessMessage} />
            :
            <Signup switchState={switchState} setSignupSuccessMessage={setSignupSuccessMessage} />
    )
}

export default Auth