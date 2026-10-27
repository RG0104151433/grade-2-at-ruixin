// 力扣/OJ 提交片段的公共前置头。
// 用法：g++ -std=c++23 -include 算法/tools/oj.h -fsyntax-only <题解文件>.cpp
// 题目代码本身仍保持"提交框原样"（只有 class Solution / 目标函数，无 #include、无 main），
// 靠这个头文件补上标准库、using namespace std，以及力扣常用的链表/二叉树节点定义。
#pragma once
#include <bits/stdc++.h>
using namespace std;

// 力扣 OJ 预置的节点类型（提交框里不显示，但代码可以直接用）
struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};
