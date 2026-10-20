#include <stdlib.h>
#include <stdbool.h>//注意这个库

typedef struct Node {
    char data;
    struct Node* prev;  // 指向栈中前一个节点（即下一个更低的节点）
} Node;

// 入栈：将字符 s 压入由 top 指向的栈顶（top 是 Node**，用于修改栈顶指针）
void inStack(char s, Node** top) {
    Node* newNode = (Node*)malloc(sizeof(Node));//一定要有(Node*)
    if (!newNode) return; // 内存分配失败（实际项目应处理）
    newNode->data = s;
    newNode->prev = *top; // 新节点的 prev 指向原栈顶  prev为指针，故应对应*top同为指针
    *top = newNode;       // 更新栈顶为新节点  指针对应指针
}

// 出栈：弹出栈顶元素，返回其 data；若栈空，返回 '\0'；同时更新 *top
char pop(Node** top) {
    if (!*top) return '\0'; // 栈空
    Node* temp = *top;
    char data = temp->data;
    *top = temp->prev; // 更新栈顶为下一个节点
    free(temp);
    return data;
}

// 判断括号字符串是否有效
bool isValid(char* s) {
    if (!s) return true; // 空指针视为有效（或可返回 false，按需）
    Node* top = NULL; // 初始栈为空（注意：不再 malloc 哑节点！）
    int i = 0;
    while (s[i] != '\0') {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            inStack(c, &top); // 注意：传 &top（Node**）
        } else if (c == ')' || c == ']' || c == '}') {
            char topChar = pop(&top);// 检查匹配性
            if ((c == ')' && topChar != '(') ||
                (c == ']' && topChar != '[') ||
                (c == '}' && topChar != '{')) {
                return false;
            }
        }// 忽略非括号字符（题目通常只含括号，但健壮性考虑）
        i++;
    }
    return top == NULL;// 最终栈必须为空才合法
}
