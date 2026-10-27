char* trimTrailingVowels(char* s) {
    int len = strlen(s);
    
    // 从后往前找到第一个非元音字符的位置
    int i = len - 1;
    while (i >= 0 && strchr("aeiou", s[i]) != NULL) {
        i--;
    }
    
    // 计算新长度
    int new_len = i + 1;
    
    // 分配内存并复制
    char* ans = malloc(new_len + 1);
    strncpy(ans, s, new_len);
    ans[new_len] = '\0';
    
    return ans;
}
