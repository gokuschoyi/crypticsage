import React, { useState } from 'react'
import Login from '../../components/authorization/login/Login'
import Signup from '../../components/authorization/signup/Signup'
const Auth = () => {
    const [isLogin, setIsLogin] = useState(true)
    const switchState = () => {
        setIsLogin(!isLogin)
    }
    return (
        isLogin ? <Login switchState={switchState} /> : <Signup switchState={switchState} />
    )
}

export default Auth