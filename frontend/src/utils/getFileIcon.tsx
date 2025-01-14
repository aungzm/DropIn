const fileIconMap: { [key: string]: string } = {
    'pdf': '/src/assets/pdf.png',
    'doc': '/src/assets/doc.png',
    'xls': '/src/assets/xls.png',
    'jpg': '/src/assets/jpg.png',
    'png': '/src/assets/png.png',
    'default': '/src/assets/file.png',
    'xlsx': '/src/assets/xlsx.png',
    'docx': '/src/assets/docx.png',
    'ppt': '/src/assets/ppt.png',
    'pptx': '/src/assets/pptx.png',
    'txt': '/src/assets/txt.png',
    'gif': '/src/assets/gif.png',
    'jpeg': '/src/assets/jpeg.png',
};

const getFileIcon = (fileExtension: string): string => {
    return fileIconMap[fileExtension] || fileIconMap['default'];
};

export default getFileIcon;