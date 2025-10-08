package com.web.Service;

import java.security.SecureRandom;
import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.web.Model.User;
import com.web.Repository.UserRepository;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    public User loginByEmail(String account, String password) {
        User user = userRepository.findByEmail(account);
        if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    public User loginByPhone(String account, String password) {
        User user = userRepository.findByPhone(account);
        if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> getAllUser() {
        return userRepository.findAll();
    }

    public User createUser(User character) {
        User phone = userRepository.findByPhone(character.getPhone());
        User email = userRepository.findByEmail(character.getEmail());
        if (phone != null || email != null) {
            return null;
        }
        String encodedPassword = passwordEncoder.encode("123");
        character.setPasswordHash(encodedPassword);
        return userRepository.save(character);
    }

    public User updateUser(Long id, User newChar) {
        User oldUser = userRepository.findById(id).orElse(null);
        if (oldUser == null) return null;
        newChar.setPasswordHash(oldUser.getPasswordHash());

        return userRepository.save(newChar);
    }
    
    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean logout(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return false;
        }
        userRepository.save(user);
        return true;
    }

    public User repassUser(Long id, User newChar) {
        User existingUser = userRepository.findById(id).orElse(null);
        if (existingUser == null || newChar.getPasswordHash() == null) {
            return null;
        }
        String encodedPassword = passwordEncoder.encode(newChar.getPasswordHash());
        newChar.setPasswordHash(encodedPassword);
        return userRepository.save(newChar);
    }

    @Transactional
    public boolean repass(String email, String token) {
        if (email == null && userRepository.findByEmail(email) == null) {
             return false;
        }

        String resetLink = "http://localhost:8080/api/auth/reset-password?token=" + token;

        String subject = "Đổi mật khẩu tài khoản của bạn";
        String body = "Đây là link đổi mật khẩu của bạn (Lưu ý không tiết lộ link này ra ngoài!)\n\n"
                    + "" + resetLink + "\n\n"
                    + "Vui lòng thực hiện đặt mật khẩu sau 5 phút sẽ hết hiệu lực.\n\n"
                    + "Trân trọng,\n"
                    + "Đội ngũ phát triển.";
        try {
            emailService.sendEmail(email, subject, body);
        } catch (Exception e) {
            System.err.println("Failed to send registration email to " + email + ": " + e.getMessage());
        }

        return true;
    }

    public User resetpass(String email, String newPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            return null;
        }
        if (user.getStatus().equals("Chưa kích hoạt")) {
            user.setStatus("Đã kích hoạt");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return user;
    }

    @Transactional
    public User registerUser(User user, String token) {
        if (userRepository.findByPhone(user.getPhone()) != null) {
            System.err.println("Registration failed: Số điện thoại '" + user.getPhone() + "' đã tồn tại.");
            return null;
        }
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()) != null) {
             System.err.println("Registration failed: Email '" + user.getEmail() + "' đã tồn tại.");
             return null;
        }

        String generatedPassword = generateRandomPassword(10);

        String encodedPassword = passwordEncoder.encode(generatedPassword);
        user.setPasswordHash(encodedPassword);
        user.setStatus("Chưa kích hoạt");

        User savedUser = userRepository.save(user);

        String Link = "http://localhost:8080/api/auth/reset-password?token=" + token;

        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            String subject = "Mật khẩu đăng ký tài khoản của bạn";
            String body = "Chào mừng bạn đến với Chapel Store, " + user.getFullName() + "!\n\n"
                        + "Link thay đổi mật khẩu của bạn là: " + Link + "\n\n"
                        + "Vui lòng thực hiện thay đổi mật khẩu trong vòng 24 giờ.\n\n"
                        + "Trân trọng,\n"
                        + "Đội ngũ phát triển Chapel Store.";
            try {
                emailService.sendEmail(user.getEmail(), subject, body);
            } catch (Exception e) {
                System.err.println("Failed to send registration email to " + user.getEmail() + ": " + e.getMessage());
            }
        } else {
            System.err.println("User " + user.getFullName() + " does not have an email address to send password to.");
        }

        return savedUser;
    }

    /**
     * Generates a random alphanumeric password.
     * @param length The desired length of the password.
     * @return A randomly generated password.
     */
    private String generateRandomPassword(int length) {
        String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
        String CHAR_UPPER = CHAR_LOWER.toUpperCase();
        String NUMBER = "0123456789";

        String PASSWORD_CHARS = CHAR_LOWER + CHAR_UPPER + NUMBER;
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int randomIndex = random.nextInt(PASSWORD_CHARS.length());
            sb.append(PASSWORD_CHARS.charAt(randomIndex));
        }
        return sb.toString();
    }
}