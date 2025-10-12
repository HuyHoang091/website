package com.web.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
      .allowedOrigins("http://localhost:3000", "http://192.168.1.7:3000", "http://localhost:5000", "https://e31d53bff505.ngrok-free.app", "http://localhost:5001")
      .allowedMethods("GET", "POST", "PUT", "DELETE")
      .allowCredentials(true);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
      registry.addResourceHandler("/images/**")
              .addResourceLocations("file:uploads/");
  }
}