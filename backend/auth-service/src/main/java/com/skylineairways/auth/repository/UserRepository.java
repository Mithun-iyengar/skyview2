package com.skylineairways.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.skylineairways.auth.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByFullNameIgnoreCase(String fullName);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByFullNameIgnoreCase(String fullName);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);
}
