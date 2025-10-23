import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Tabs, Tab, Typography, TextField, Button, Grid, Paper, 
    Snackbar, Alert, CircularProgress, Switch, FormControlLabel,
    Tooltip, Dialog, DialogActions, DialogContent, 
    DialogContentText, DialogTitle 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PaymentIcon from '@mui/icons-material/Payment';
import FacebookIcon from '@mui/icons-material/Facebook';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import styles from './ConfigManager.module.css';

export default function ConfigManager() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    
    // State cho dialog xác nhận
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        onConfirm: null
    });
    
    // State cho kết quả kiểm tra kết nối
    const [connectionStatus, setConnectionStatus] = useState({
        email: null,
        paypal: null,
        facebook: null,
        openRouter: null
    });
    
    // State cho cấu hình OpenRouter
    const [openRouterConfig, setOpenRouterConfig] = useState({
        url: '',
        key: '',
        model: ''
    });
    
    const token = localStorage.getItem('tokenJWT');
    const getHeaderAuth = () => {
        return {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
    }
    
    // Email configuration
    const [emailConfig, setEmailConfig] = useState({
        host: '',
        port: 0,
        username: '',
        password: '',
        properties: {
            mail: {
                smtp: {
                    auth: true,
                    starttls: {
                        enable: true,
                        required: true
                    }
                }
            }
        }
    });
    
    // PayPal configuration
    const [paypalConfig, setPaypalConfig] = useState({
        clientId: '',
        secret: '',
        baseUrl: ''
    });
    
    // Facebook configuration
    const [facebookToken, setFacebookToken] = useState('');
    
    // Fetch configurations
    useEffect(() => {
        fetchEmailConfig();
        fetchPaypalConfig();
        fetchFacebookToken();
        fetchOpenRouterConfig();
    }, []);
    
    // Email config handlers
    const fetchEmailConfig = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/config/email`, getHeaderAuth());
            
            // Khởi tạo đầy đủ cấu trúc
            const data = response.data || {};
            
            const normalizedConfig = {
                host: data.host || '',
                port: data.port || 587,
                username: data.username || '',
                password: data.password || '',
                properties: {
                    mail: {
                        smtp: {
                            auth: data.smtpAuth,
                            starttls: {
                                enable: data.startTlsEnable,
                                required: data.startTlsRequired
                            }
                        }
                    }
                }
            };
            
            setEmailConfig(normalizedConfig);
        } catch (error) {
            showNotification('Không thể tải cấu hình email', 'error');
            console.error('Error fetching email config:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const saveEmailConfig = async () => {
        setLoading(true);
        try {
            // Chuyển đổi từ cấu trúc nội bộ sang định dạng API
            const configForApi = {
                host: emailConfig.host || '',
                port: emailConfig.port || 587,
                username: emailConfig.username || '',
                password: emailConfig.password || '',
                smtpAuth: emailConfig.properties?.mail?.smtp?.auth || false,
                startTlsEnable: emailConfig.properties?.mail?.smtp?.starttls?.enable || false,
                startTlsRequired: emailConfig.properties?.mail?.smtp?.starttls?.required || false
            };
            
            await axios.put(`${process.env.REACT_APP_API_URL}/api/config/email`, configForApi, getHeaderAuth());
            showNotification('Cập nhật cấu hình email thành công');
            await fetchEmailConfig(); // Tải lại config sau khi cập nhật
        } catch (error) {
            showNotification('Không thể kết nối đến email', 'error');
            console.error('Error saving email config:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // PayPal config handlers
    const fetchPaypalConfig = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/config/paypal`, getHeaderAuth());
            setPaypalConfig(response.data);
        } catch (error) {
            showNotification('Không thể tải cấu hình PayPal', 'error');
            console.error('Error fetching PayPal config:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const savePaypalConfig = async () => {
        setLoading(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/config/paypal`, paypalConfig, getHeaderAuth());
            showNotification('Cập nhật cấu hình PayPal thành công');
            await fetchPaypalConfig(); // Tải lại config sau khi cập nhật
        } catch (error) {
            showNotification('Không thể kết nối đến PayPal', 'error');
            console.error('Error saving PayPal config:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Facebook token handlers
    const fetchFacebookToken = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/config/facebook/token`, getHeaderAuth());
            setFacebookToken(response.data || '');
        } catch (error) {
            // Token có thể không tồn tại, không hiển thị thông báo lỗi
            console.error('Error fetching Facebook token:', error);
            setFacebookToken('');
        } finally {
            setLoading(false);
        }
    };
    
    const saveFacebookToken = async () => {
        setLoading(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/config/facebook/token`, 
                facebookToken, 
                {
                    ...getHeaderAuth(),
                    headers: {
                        ...getHeaderAuth().headers,
                        'Content-Type': 'text/plain'
                    }
                }
            );
            showNotification('Cập nhật token Facebook thành công');
            await fetchFacebookToken(); // Tải lại token sau khi cập nhật
        } catch (error) {
            showNotification('Token Facebook không hợp lệ', 'error');
            console.error('Error saving Facebook token:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // OpenRouter config handlers
    const fetchOpenRouterConfig = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/config/openrouter`, getHeaderAuth());
            setOpenRouterConfig(response.data);
        } catch (error) {
            showNotification('Không thể tải cấu hình AI Model', 'error');
            console.error('Error fetching AI Model config:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const saveOpenRouterConfig = async () => {
        // Nếu chưa kiểm tra kết nối, hiển thị dialog xác nhận
        if (connectionStatus.openRouter !== true) {
            setConfirmDialog({
                open: true,
                title: 'Xác nhận lưu cấu hình AI Model',
                message: 'Bạn chưa kiểm tra kết nối hoặc kết nối không thành công. Vẫn muốn lưu cấu hình này?',
                onConfirm: () => {
                    setConfirmDialog({ ...confirmDialog, open: false });
                    processSaveOpenRouterConfig();
                }
            });
        } else {
            processSaveOpenRouterConfig();
        }
    };
    
    const processSaveOpenRouterConfig = async () => {
        setLoading(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/config/openrouter`, 
                openRouterConfig, 
                getHeaderAuth()
            );
            
            showNotification('Cập nhật cấu hình AI Model thành công');
            await fetchOpenRouterConfig(); // Tải lại config sau khi cập nhật
        } catch (error) {
            showNotification(
                error.response?.data || 'Không thể cập nhật cấu hình AI Model', 
                'error'
            );
            console.error('Error saving OpenRouter config:', error);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };
    
    // Show notification
    const showNotification = (message, severity = 'success') => {
        setNotification({
            open: true,
            message,
            severity
        });
    };
    
    const handleCloseNotification = () => {
        setNotification({
            ...notification,
            open: false
        });
    };
    
    // Handle input changes
    const handleEmailChange = (e) => {
        const { name, value: inputValue, type, checked } = e.target;
        
        try {
            if (name === 'port') {
                setEmailConfig({
                    ...emailConfig,
                    port: parseInt(inputValue, 10) || 0
                });
            } else if (name === 'auth') {
                // Kiểm tra và đảm bảo các đối tượng lồng nhau tồn tại
                setEmailConfig({
                    ...emailConfig,
                    properties: {
                        ...emailConfig.properties || {},
                        mail: {
                            ...(emailConfig.properties?.mail || {}),
                            smtp: {
                                ...(emailConfig.properties?.mail?.smtp || {}),
                                auth: checked
                            }
                        }
                    }
                });
            } else if (name === 'starttls.enable') {
                setEmailConfig({
                    ...emailConfig,
                    properties: {
                        ...emailConfig.properties || {},
                        mail: {
                            ...(emailConfig.properties?.mail || {}),
                            smtp: {
                                ...(emailConfig.properties?.mail?.smtp || {}),
                                starttls: {
                                    ...(emailConfig.properties?.mail?.smtp?.starttls || {}),
                                    enable: checked
                                }
                            }
                        }
                    }
                });
            } else if (name === 'starttls.required') {
                setEmailConfig({
                    ...emailConfig,
                    properties: {
                        ...emailConfig.properties || {},
                        mail: {
                            ...(emailConfig.properties?.mail || {}),
                            smtp: {
                                ...(emailConfig.properties?.mail?.smtp || {}),
                                starttls: {
                                    ...(emailConfig.properties?.mail?.smtp?.starttls || {}),
                                    required: checked
                                }
                            }
                        }
                    }
                });
            } else {
                setEmailConfig({
                    ...emailConfig,
                    [name]: inputValue
                });
            }
        } catch (error) {
            console.error("Error updating email config:", error);
            showNotification('Có lỗi khi cập nhật cấu hình', 'error');
        }
    };
    
    const handlePaypalChange = (e) => {
        const { name, value } = e.target;
        setPaypalConfig({
            ...paypalConfig,
            [name]: value
        });
    };

    const handleFacebookTokenChange = (e) => {
        setFacebookToken(e.target.value);
    };
    
    const handleOpenRouterChange = (e) => {
        const { name, value } = e.target;
        setOpenRouterConfig({
            ...openRouterConfig,
            [name]: value
        });
    };
    
    // Hàm kiểm tra kết nối OpenRouter
    const testOpenRouterConnection = async () => {
        setLoading(true);
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/config/openrouter/test`, 
                openRouterConfig, 
                getHeaderAuth()
            );
            
            setConnectionStatus({
                ...connectionStatus,
                openRouter: true
            });
            
            showNotification('Kết nối OpenRouter API thành công!', 'success');
        } catch (error) {
            setConnectionStatus({
                ...connectionStatus,
                openRouter: false
            });
            
            showNotification(
                error.response?.data || 'Không thể kết nối đến OpenRouter API', 
                'error'
            );
            console.error('Error testing OpenRouter connection:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Box className={styles.container}>
            <Typography variant="h4" component="h1" gutterBottom className={styles.pageTitle}>
                <SecurityIcon className={styles.titleIcon} />
                Quản lý cấu hình hệ thống
            </Typography>
            
            <Paper elevation={3} className={styles.tabContainer}>
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    variant="fullWidth"
                    className={styles.tabs}
                >
                    <Tab 
                        label="Email" 
                        icon={<MailOutlineIcon />} 
                        className={styles.tab} 
                    />
                    <Tab 
                        label="PayPal" 
                        icon={<PaymentIcon />} 
                        className={styles.tab} 
                    />
                    <Tab 
                        label="Facebook" 
                        icon={<FacebookIcon />} 
                        className={styles.tab} 
                    />
                    <Tab 
                        label="AI Model" 
                        icon={<ScienceIcon />} 
                        className={styles.tab} 
                    />
                </Tabs>
                
                <Box className={styles.tabContent}>
                    {/* Email Configuration */}
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom className={styles.sectionTitle}>
                                Cấu hình Email
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField 
                                        fullWidth 
                                        label="SMTP Host" 
                                        name="host" 
                                        value={emailConfig.host || ''} 
                                        onChange={handleEmailChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="smtp.gmail.com"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField 
                                        fullWidth 
                                        label="SMTP Port" 
                                        name="port" 
                                        type="number"
                                        value={emailConfig.port || ''} 
                                        onChange={handleEmailChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="587"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField 
                                        fullWidth 
                                        label="Username" 
                                        name="username" 
                                        value={emailConfig.username || ''} 
                                        onChange={handleEmailChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="your-email@gmail.com"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField 
                                        fullWidth 
                                        label="Password" 
                                        name="password" 
                                        type="password" 
                                        value={emailConfig.password || ''} 
                                        onChange={handleEmailChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="your-app-password"
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch 
                                                checked={emailConfig.properties?.mail?.smtp?.auth || false} 
                                                onChange={handleEmailChange}
                                                name="auth"
                                                color="primary"
                                            />
                                        }
                                        label="Xác thực SMTP"
                                        className={styles.switchControl}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch 
                                                checked={emailConfig.properties?.mail?.smtp?.starttls?.enable || false} 
                                                onChange={handleEmailChange}
                                                name="starttls.enable"
                                                color="primary"
                                            />
                                        }
                                        label="Bật STARTTLS"
                                        className={styles.switchControl}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch 
                                                checked={emailConfig.properties?.mail?.smtp?.starttls?.required || false} 
                                                onChange={handleEmailChange}
                                                name="starttls.required"
                                                color="primary"
                                            />
                                        }
                                        label="Yêu cầu STARTTLS"
                                        className={styles.switchControl}
                                    />
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Box className={styles.actionButtons}>
                                        <Button 
                                            variant="outlined" 
                                            onClick={fetchEmailConfig} 
                                            startIcon={<RefreshIcon />} 
                                            className={styles.refreshButton}
                                            disabled={loading}
                                        >
                                            Tải lại
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            onClick={saveEmailConfig}
                                            startIcon={<SaveIcon />}
                                            className={styles.saveButton}
                                            disabled={loading}
                                        >
                                            Lưu cấu hình
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                    
                    {/* PayPal Configuration */}
                    {activeTab === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom className={styles.sectionTitle}>
                                Cấu hình PayPal
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="Client ID" 
                                        name="clientId" 
                                        value={paypalConfig.clientId || ''} 
                                        onChange={handlePaypalChange}
                                        margin="normal"
                                        className={styles.textField}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="Secret" 
                                        name="secret" 
                                        type="password" 
                                        value={paypalConfig.secret || ''} 
                                        onChange={handlePaypalChange}
                                        margin="normal"
                                        className={styles.textField}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="Base URL" 
                                        name="baseUrl" 
                                        value={paypalConfig.baseUrl || ''} 
                                        onChange={handlePaypalChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="https://api-m.sandbox.paypal.com"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box className={styles.actionButtons}>
                                        <Button 
                                            variant="outlined" 
                                            onClick={fetchPaypalConfig} 
                                            startIcon={<RefreshIcon />} 
                                            className={styles.refreshButton}
                                            disabled={loading}
                                        >
                                            Tải lại
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            onClick={savePaypalConfig}
                                            startIcon={<SaveIcon />}
                                            className={styles.saveButton}
                                            disabled={loading}
                                        >
                                            Lưu cấu hình
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* Facebook Configuration */}
                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom className={styles.sectionTitle}>
                                Cấu hình Facebook
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="Page Access Token" 
                                        name="facebookToken" 
                                        value={facebookToken || ''} 
                                        onChange={handleFacebookTokenChange}
                                        margin="normal"
                                        className={styles.textField}
                                        multiline
                                        rows={4}
                                        placeholder="EAAxxxx..."
                                        helperText="Token truy cập từ Facebook Page để tích hợp với ứng dụng"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box className={styles.infoBox}>
                                        <Typography variant="body2" color="textSecondary">
                                            Page Access Token cho phép ứng dụng của bạn đăng tin, quản lý bình luận và tin nhắn trên Facebook Page của doanh nghiệp.
                                            Để lấy token, hãy tạo ứng dụng trên <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">Facebook Developer</a> và cấp quyền quản lý Page.
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box className={styles.actionButtons}>
                                        <Button 
                                            variant="outlined" 
                                            onClick={fetchFacebookToken} 
                                            startIcon={<RefreshIcon />} 
                                            className={styles.refreshButton}
                                            disabled={loading}
                                        >
                                            Tải lại
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            onClick={saveFacebookToken}
                                            startIcon={<SaveIcon />}
                                            className={styles.saveButton}
                                            disabled={loading}
                                        >
                                            Lưu token
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* AI Model Configuration */}
                    {activeTab === 3 && (
                        <Box>
                            <Typography variant="h6" gutterBottom className={styles.sectionTitle}>
                                Cấu hình AI Model
                                {connectionStatus.openRouter === true && (
                                    <Tooltip title="Kết nối thành công">
                                        <CheckCircleIcon color="success" className={styles.statusIcon} />
                                    </Tooltip>
                                )}
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="OpenRouter API URL" 
                                        name="url" 
                                        value={openRouterConfig.url || ''} 
                                        onChange={handleOpenRouterChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="https://openrouter.ai/api/v1"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="API Key" 
                                        name="key" 
                                        type="password" 
                                        value={openRouterConfig.key || ''} 
                                        onChange={handleOpenRouterChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="sk-..."
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField 
                                        fullWidth 
                                        label="Model" 
                                        name="model" 
                                        value={openRouterConfig.model || ''} 
                                        onChange={handleOpenRouterChange}
                                        margin="normal"
                                        className={styles.textField}
                                        placeholder="gpt-3.5-turbo"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Box className={styles.infoBox}>
                                        <Typography variant="body2" color="textSecondary">
                                            OpenRouter là dịch vụ cho phép truy cập nhiều mô hình AI khác nhau thông qua một API thống nhất.
                                            Đăng ký tại <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer">OpenRouter.ai</a> để lấy API key.
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box className={styles.actionButtons}>
                                        <Button 
                                            variant="outlined" 
                                            onClick={fetchOpenRouterConfig} 
                                            startIcon={<RefreshIcon />} 
                                            className={styles.actionButton}
                                            disabled={loading}
                                        >
                                            Tải lại
                                        </Button>
                                        
                                        <Button 
                                            variant="outlined" 
                                            color="info" 
                                            onClick={testOpenRouterConnection}
                                            startIcon={<NetworkCheckIcon />}
                                            className={styles.actionButton}
                                            disabled={loading}
                                        >
                                            Kiểm tra kết nối
                                        </Button>
                                        
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            onClick={saveOpenRouterConfig}
                                            startIcon={<SaveIcon />}
                                            className={styles.actionButton}
                                            disabled={loading}
                                        >
                                            Lưu cấu hình
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Paper>
            
            {/* Dialog xác nhận */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({...confirmDialog, open: false})}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {confirmDialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({...confirmDialog, open: false})} color="primary">
                        Huỷ
                    </Button>
                    <Button onClick={confirmDialog.onConfirm} color="primary" autoFocus>
                        Xác nhận
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Loading overlay */}
            {loading && (
                <Box className={styles.loadingOverlay}>
                    <CircularProgress />
                </Box>
            )}
            
            {/* Notification */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}