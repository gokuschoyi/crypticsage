import React from 'react'
import { Box, Typography, Card, CardContent, CardMedia, Grid } from "@mui/material"
import "./Features.css"
import FEATURES_DATA from './FeatureContent'
const Features = () => {
    const CustomCard = (props) => {
        const { title, subtitle, content } = props
        return (
            <Card className="features-card" sx={{ textAlign: 'start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                        <Typography variant="h3" fontWeight={400} className="padding">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={300} color="text.secondary" className="padding">
                            {subtitle}
                        </Typography>
                        <Typography textAlign="justify" variant="h6" fontWeight={300} color="white" >
                            {content}
                        </Typography>
                    </CardContent>
                </Box>
                <Box>
                    <CardMedia
                        component="img"
                        sx={{ width: 151 }}
                        image="https://source.unsplash.com/random"
                        alt="Live from space album cover"
                    />
                </Box>
            </Card>
        )
    }
    return (
        <Box id='whatis' className="features-container">
            <Typography fontWeight={300} variant="h1" pt={10}>Features</Typography>
            <Box className="feature-box">
                <Grid justifyContent="center" container p={8} spacing={{ xs: 2, md: 3 }} >
                    {FEATURES_DATA.map((item, index) => {
                        return (
                            <Grid sx={{ display: 'flex', justifyContent: 'center' }} item xs={12} sm={12} md={12} lg={6} key={index}>
                                <CustomCard key={index} title={item.title} subtitle={item.subtitle} content={item.content} />
                            </Grid>
                        )
                    })}
                </Grid>
            </Box>
        </Box>
    )
}

export default Features