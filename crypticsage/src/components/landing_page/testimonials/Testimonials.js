import React from 'react'
import './Testimonials.css'
import TESTIMONIAL_DATA from './TestimonialContent'
import { Box, Typography, Card, CardContent, Grid } from "@mui/material"
const Testimonials = () => {
    const CustomCard = (props) => {
        const { title, content } = props
        return (
            <Card className="testimonial-card" sx={{ textAlign: 'start' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                        <Typography variant="h3" fontWeight={400} className="padding">
                            {title}
                        </Typography>
                        <Typography textAlign="justify" variant="h6" fontWeight={300} color="white" >
                            {content}
                        </Typography>
                    </CardContent>
                </Box>
            </Card>
        )
    }

    return (
        <Box id="testimonials" className="testimonial-container" >
            <Typography fontWeight={300} fontSize="40px" letterSpacing="5px" variant="h1" pt={18}>TESTIMONIALS</Typography>
            <Box className="testimonial-box">
                <Grid justifyContent="center" container p={8} spacing={{ xs: 2, md: 3 }} className="testimonial-grid">
                    {TESTIMONIAL_DATA.map((item, index) => {
                        return (
                            <Grid sx={{ display: 'flex', justifyContent: 'center' }} item xs={12} sm={12} md={12} lg={6} key={index}>
                                <CustomCard key={index} title={item.title} content={item.content} />
                            </Grid>
                        )
                    })}
                </Grid>
            </Box>
        </Box>
    )
}

export default Testimonials