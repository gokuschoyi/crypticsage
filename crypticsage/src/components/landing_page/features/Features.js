import React from 'react'
import { Box, Typography, Card, CardContent, CardMedia, Grid } from "@mui/material"
import "./Features.css"
import FEATURES_DATA from './FeatureContent'
const Features = () => {
    const CustomCard = (props) => {
        const { title, subtitle, content } = props
        return (
            <Card className="features-card" sx={{ textAlign: 'start', backgroundColor:'#121212' }}>
                <CardContent sx={{ flex: '1 0 auto' }}>
                    <Typography variant="h3" fontWeight={400} color="#fafafa" className="padding-feature">
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={300} color="#fafafa" className="padding-feature">
                        {subtitle}
                    </Typography>
                    <Typography textAlign="justify" variant="h6" fontWeight={300} color="#fafafa" >
                        {content}
                    </Typography>
                </CardContent>

                <Box className='features-image-container'>
                    <CardMedia
                        component="img"
                        
                        image="https://picsum.photos/400/500"
                        alt="Live from space album cover"
                    />
                </Box>
            </Card>
        )
    }
    return (
        <Box id='whatis' className="features-container" sx={{ backgroundColor: 'white' }} >
            <Typography className="features-text" fontWeight={300} fontSize="50px" letterSpacing="5px" variant="h1" pt={18} sx={{ color: 'black' }}>FEATURES</Typography>
            <Box className="feature-box">
                <Grid justifyContent="center" container p={8} spacing={{ xs: 2, md: 3, lg: 5 }} className="features-grid">
                    {FEATURES_DATA.map((item, index) => {
                        return (
                            <Grid className='grid-item-container' sx={{ display: 'flex', justifyContent: 'center' }} item xs={12} sm={12} md={6} lg={6} key={index}>
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