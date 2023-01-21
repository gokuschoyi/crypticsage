import React, { useState } from 'react'
import Login from '../../components/authorization/login/Login'
import Signup from '../../components/authorization/signup/Signup'
import { Outlet } from 'react-router-dom'
const Auth = () => {
    const [isLogin, setIsLogin] = useState(true)
    const switchState = () => {
        setIsLogin(!isLogin)
    }
    return (
        isLogin ? <><Login switchState={switchState} /><Outlet /></> : <Signup switchState={switchState} />
    )
}

export default Auth