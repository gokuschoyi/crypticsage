const sortAndGroupLessons = (lessonArray) => {
    const sortedLessons = lessonArray.sort((a, b) => {
        if (a.section_id < b.section_id) {
            return -1;
        } else if (a.section_id > b.section_id) {
            return 1;
        }
        return 0;
    });

    const groupedLessons = {};
    sortedLessons.forEach((lesson) => {
        if (!groupedLessons[lesson.section_id]) {
            groupedLessons[lesson.section_id] = [];
        }
        groupedLessons[lesson.section_id].push(lesson);
    });

    return groupedLessons;
};

module.exports={
    sortAndGroupLessons
}