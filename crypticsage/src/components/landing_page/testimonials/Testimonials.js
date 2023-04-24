import React from 'react'
import './Testimonials.css'
import TESTIMONIAL_DATA from './TestimonialContent'
import { Box, Typography, Card, CardContent, Grid } from "@mui/material"
const Testimonials = () => {
    const CustomCard = (props) => {
        const { title, content } = props
        return (
            <Card className="testimonial-card" sx={{ textAlign: 'start', backgroundColor:'#121212' }}>
                <CardContent >
                    <Typography variant="h3" fontWeight={400} color="#fafafa" sx={{paddingBottom:'10px'}}>
                        {title}
                    </Typography>
                    <Typography textAlign="justify" variant="h6" fontWeight={300} color="#fafafa" >
                        {content}
                    </Typography>
                </CardContent>
            </Card>
        )
    }

    return (
        <Box id="testimonials" className="testimonial-container" sx={{ backgroundColor: 'white' }} >
            <Typography className="testimonial-text" fontWeight={300} fontSize="50px" letterSpacing="5px" variant="h1" pt={18} sx={{ color: 'black' }}>TESTIMONIALS</Typography>
            <Box className="testimonial-box">
                <Grid justifyContent="center" container p={8} spacing={{ xs: 2, md: 3 }} className="testimonial-grid">
                    {TESTIMONIAL_DATA.map((item, index) => {
                        return (
                            <Grid className='grid-item-container' sx={{ display: 'flex', justifyContent: 'center' }} item xs={12} sm={12} md={6} lg={6} key={index}>
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