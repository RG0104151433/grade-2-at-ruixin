bool isValid(char* s) {//灵神解法
    int top = 0; // 直接把 s 当作栈！！！
    for (int i = 0; s[i]; i++) {
        char c = s[i];
        if (c == '(') {
            s[top++] = ')'; // 入栈对应的右括号
        } else if (c == '[') {
            s[top++] = ']';
        } else if (c == '{') {
            s[top++] = '}';
        } else if (top == 0 || s[--top] != c) { // c 是右括号
            return false; // 没有左括号，或者左括号类型不对
        }
    }
    return top == 0; // 所有左括号必须匹配完毕
}
